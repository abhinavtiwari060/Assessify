const TestAttempt = require('../models/TestAttempt');
const Test = require('../models/Test');
const Question = require('../models/Question');
const { logAudit } = require('../middleware/auth');

// @desc    Start a test attempt (Optimized + Race-Condition Safe)
// @route   POST /api/tests/:id/start
// @access  Private (Student)
const startAttempt = async (req, res) => {
  try {
    const testId = req.params.id;
    const studentId = req.user._id;

    // 1. Lean Test Lookup selecting only required fields
    const test = await Test.findById(testId)
      .select('title isPublished maxAttempts totalMarks')
      .lean();

    if (!test || !test.isPublished) {
      return res.status(404).json({ message: 'Test is not available or unpublished' });
    }

    // 2. Check if an attempt is already in progress (Fast Compound Index Scan)
    const existingAttempt = await TestAttempt.findOne({
      testId,
      studentId,
      status: 'in_progress',
    }).lean();

    if (existingAttempt) {
      return res.json(existingAttempt);
    }

    // 3. Count completed attempts (Fast Index Scan)
    const completedAttempts = await TestAttempt.countDocuments({
      testId,
      studentId,
      status: { $ne: 'in_progress' },
    });

    if (completedAttempts >= test.maxAttempts) {
      return res.status(400).json({
        message: `You have reached the maximum allowed attempts (${test.maxAttempts}) for this test.`,
      });
    }

    // 4. Fetch questions selecting ONLY _id and marks (Lean query)
    const questions = await Question.find({ testId })
      .select('_id marks')
      .sort({ order: 1 })
      .lean();

    const blankAnswers = questions.map((q) => ({
      questionId: q._id,
      selectedOptionIndex: null,
      timeSpentSeconds: 0,
      isCorrect: false,
      marksAwarded: 0,
      isFlagged: false,
    }));

    const calculatedMaxMarks =
      test.totalMarks || questions.reduce((acc, curr) => acc + (curr.marks || 1), 0);

    // 5. Try creating attempt document with duplicate key protection
    try {
      const attempt = await TestAttempt.create({
        testId,
        studentId,
        answers: blankAnswers,
        maxMarks: calculatedMaxMarks,
        startedAt: new Date(),
      });

      logAudit(req, 'TEST_STARTED', `Student started test "${test.title}"`);
      return res.status(201).json(attempt);
    } catch (createErr) {
      // Handle MongoDB E11000 duplicate key error (race condition safeguard)
      if (createErr.code === 11000) {
        const raceAttempt = await TestAttempt.findOne({
          testId,
          studentId,
          status: 'in_progress',
        }).lean();
        if (raceAttempt) {
          return res.json(raceAttempt);
        }
      }
      throw createErr;
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Autosave single answer during test
// @route   PUT /api/attempts/:id/save
// @access  Private (Student)
const autoSaveAnswer = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const { questionId, selectedOptionIndex, timeSpentSeconds, isFlagged } = req.body;

    const attempt = await TestAttempt.findById(attemptId);
    if (!attempt || attempt.studentId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Active attempt not found' });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ message: 'Attempt is already submitted and locked' });
    }

    const answerIndex = attempt.answers.findIndex(
      (a) => a.questionId.toString() === questionId
    );

    if (answerIndex !== -1) {
      if (selectedOptionIndex !== undefined) {
        attempt.answers[answerIndex].selectedOptionIndex = selectedOptionIndex;
      }
      if (timeSpentSeconds) {
        attempt.answers[answerIndex].timeSpentSeconds += timeSpentSeconds;
      }
      if (isFlagged !== undefined) {
        attempt.answers[answerIndex].isFlagged = isFlagged;
      }
    } else {
      attempt.answers.push({
        questionId,
        selectedOptionIndex,
        timeSpentSeconds: timeSpentSeconds || 0,
        isFlagged: Boolean(isFlagged),
      });
    }

    await attempt.save();
    res.json({ message: 'Autosaved successfully', updatedAnswersCount: attempt.answers.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Batch Autosave answers during test (High-concurrency batching)
// @route   PUT /api/attempts/:id/save-batch
// @access  Private (Student)
const saveBatchAnswers = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.json({ message: 'No answers to save', updatedCount: 0 });
    }

    const attempt = await TestAttempt.findById(attemptId);
    if (!attempt || attempt.studentId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Active attempt not found' });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ message: 'Attempt is already submitted and locked' });
    }

    const answerMap = new Map(attempt.answers.map((a) => [a.questionId.toString(), a]));

    answers.forEach((incoming) => {
      if (!incoming || !incoming.questionId) return;
      const qIdStr = incoming.questionId.toString();

      if (answerMap.has(qIdStr)) {
        const existing = answerMap.get(qIdStr);
        if (incoming.selectedOptionIndex !== undefined) {
          existing.selectedOptionIndex = incoming.selectedOptionIndex;
        }
        if (incoming.timeSpentSeconds) {
          existing.timeSpentSeconds += incoming.timeSpentSeconds;
        }
        if (incoming.isFlagged !== undefined) {
          existing.isFlagged = Boolean(incoming.isFlagged);
        }
      } else {
        const newAns = {
          questionId: incoming.questionId,
          selectedOptionIndex: incoming.selectedOptionIndex !== undefined ? incoming.selectedOptionIndex : null,
          timeSpentSeconds: incoming.timeSpentSeconds || 0,
          isFlagged: Boolean(incoming.isFlagged),
        };
        attempt.answers.push(newAns);
        answerMap.set(qIdStr, newAns);
      }
    });

    await attempt.save();
    res.json({ message: 'Batch saved successfully', updatedCount: answers.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record anti-cheating tab switch / focus loss violation
// @route   POST /api/attempts/:id/violation
// @access  Private (Student)
const recordViolation = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const { type, details } = req.body;

    const attempt = await TestAttempt.findById(attemptId).populate('testId', 'title');
    if (!attempt || attempt.studentId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Active attempt not found' });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ message: 'Attempt is already submitted' });
    }

    attempt.violations.push({
      timestamp: new Date(),
      type: type || 'visibilitychange',
      details: details || 'Tab switch / focus loss detected',
    });
    attempt.violationCount += 1;

    logAudit(
      req,
      'TAB_VIOLATION',
      `Violation #${attempt.violationCount} (${type}) during test "${attempt.testId?.title}"`
    );

    let isAutoSubmitted = false;
    if (attempt.violationCount >= 3) {
      attempt.status = 'auto_submitted_violation';
      attempt.submittedAt = new Date();
      await evaluateAttemptScores(attempt);
      isAutoSubmitted = true;
    }

    await attempt.save();

    res.json({
      violationCount: attempt.violationCount,
      isAutoSubmitted,
      status: attempt.status,
      message: isAutoSubmitted
        ? 'Test automatically submitted due to multiple anti-cheating violations'
        : `Warning ${attempt.violationCount}/3: Please stay on the test window.`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit attempt
// @route   POST /api/attempts/:id/submit
// @access  Private (Student)
const submitAttempt = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const { isTimerExpired } = req.body;

    const attempt = await TestAttempt.findById(attemptId);
    if (!attempt || attempt.studentId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Active attempt not found' });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ message: 'Attempt has already been submitted' });
    }

    attempt.status = isTimerExpired ? 'auto_submitted_timer' : 'submitted';
    attempt.submittedAt = new Date();

    await evaluateAttemptScores(attempt);
    await attempt.save();

    logAudit(
      req,
      'TEST_SUBMITTED',
      `Submitted attempt for test ID ${attempt.testId} with score ${attempt.score}/${attempt.maxMarks}`
    );

    res.json({
      message: 'Test submitted successfully',
      attemptId: attempt._id,
      score: attempt.score,
      maxMarks: attempt.maxMarks,
      accuracy: attempt.accuracy,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: Calculate scores, negative marking, and accuracy (Optimized O(1) Answer Map)
async function evaluateAttemptScores(attempt) {
  const test = await Test.findById(attempt.testId)
    .select('negativeMarkingRate')
    .lean();
  const questions = await Question.find({ testId: attempt.testId })
    .select('_id correctAnswerIndex marks')
    .lean();

  let totalScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let attemptedCount = 0;
  let totalMaxMarks = 0;

  const negativeRate = test ? test.negativeMarkingRate || 0 : 0;
  const answerMap = new Map(attempt.answers.map((a) => [a.questionId.toString(), a]));

  questions.forEach((q) => {
    totalMaxMarks += q.marks;
    const studentAns = answerMap.get(q._id.toString());

    if (studentAns && studentAns.selectedOptionIndex !== null && studentAns.selectedOptionIndex !== undefined) {
      attemptedCount++;
      if (studentAns.selectedOptionIndex === q.correctAnswerIndex) {
        correctCount++;
        totalScore += q.marks;
        studentAns.isCorrect = true;
        studentAns.marksAwarded = q.marks;
      } else {
        wrongCount++;
        const deduction = q.marks * negativeRate;
        totalScore -= deduction;
        studentAns.isCorrect = false;
        studentAns.marksAwarded = -deduction;
      }
    }
  });

  attempt.score = Math.max(0, Math.round(totalScore * 100) / 100);
  attempt.maxMarks = totalMaxMarks;
  attempt.attemptedCount = attemptedCount;
  attempt.correctCount = correctCount;
  attempt.wrongCount = wrongCount;
  attempt.accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 10000) / 100 : 0;

  if (attempt.startedAt && attempt.submittedAt) {
    attempt.timeTakenSeconds = Math.round((attempt.submittedAt - attempt.startedAt) / 1000);
  }
}

// @desc    Get result of single attempt
// @route   GET /api/attempts/:id/result
// @access  Private
const getAttemptResult = async (req, res) => {
  try {
    const attempt = await TestAttempt.findById(req.params.id)
      .populate('studentId', 'name email avatar')
      .populate({
        path: 'testId',
        populate: { path: 'subjectId', select: 'name code' },
      })
      .lean();

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    const isStudentOwner = attempt.studentId._id.toString() === req.user._id.toString();
    const isTeacherOwner =
      req.user.role === 'teacher' &&
      attempt.testId.teacherId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isStudentOwner && !isTeacherOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this result' });
    }

    const questions = await Question.find({ testId: attempt.testId._id }).sort({ order: 1 }).lean();
    const answerMap = new Map(attempt.answers.map((a) => [a.questionId.toString(), a]));

    const questionResults = questions.map((q) => {
      const ans = answerMap.get(q._id.toString());
      return {
        _id: q._id,
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation,
        marks: q.marks,
        selectedOptionIndex: ans ? ans.selectedOptionIndex : null,
        isCorrect: ans ? ans.isCorrect : false,
        marksAwarded: ans ? ans.marksAwarded : 0,
        timeSpentSeconds: ans ? ans.timeSpentSeconds : 0,
      };
    });

    res.json({
      attempt,
      questions: questionResults,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get test history for logged in student
// @route   GET /api/attempts/history/me
// @access  Private (Student)
const getMyHistory = async (req, res) => {
  try {
    const attempts = await TestAttempt.find({
      studentId: req.user._id,
      status: { $ne: 'in_progress' },
    })
      .populate({
        path: 'testId',
        select: 'title type subjectId durationMinutes',
        populate: { path: 'subjectId', select: 'name code iconName' },
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  startAttempt,
  autoSaveAnswer,
  saveBatchAnswers,
  recordViolation,
  submitAttempt,
  getAttemptResult,
  getMyHistory,
};
