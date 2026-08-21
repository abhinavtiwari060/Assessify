const TestAttempt = require('../models/TestAttempt');
const Test = require('../models/Test');
const Question = require('../models/Question');
const { logAudit } = require('../middleware/auth');

// @desc    Start a test attempt
// @route   POST /api/tests/:id/start
// @access  Private (Student)
const startAttempt = async (req, res) => {
  try {
    const testId = req.params.id;
    const studentId = req.user._id;

    const test = await Test.findById(testId);
    if (!test || !test.isPublished) {
      return res.status(404).json({ message: 'Test is not available or unpublished' });
    }

    // Check completed attempts
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

    // Check if an attempt is currently in progress
    let existingAttempt = await TestAttempt.findOne({
      testId,
      studentId,
      status: 'in_progress',
    });

    if (existingAttempt) {
      return res.json(existingAttempt);
    }

    // Initialize blank answers for all questions
    const questions = await Question.find({ testId }).sort({ order: 1 });
    const blankAnswers = questions.map((q) => ({
      questionId: q._id,
      selectedOptionIndex: null,
      timeSpentSeconds: 0,
      isCorrect: false,
      marksAwarded: 0,
    }));

    const attempt = await TestAttempt.create({
      testId,
      studentId,
      answers: blankAnswers,
      maxMarks: test.totalMarks || questions.reduce((acc, curr) => acc + curr.marks, 0),
      startedAt: new Date(),
    });

    await logAudit(req, 'TEST_STARTED', `Student started test "${test.title}"`);
    res.status(201).json(attempt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Autosave answer during test
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

    // Find and update specific answer entry
    const answerIndex = attempt.answers.findIndex(
      (a) => a.questionId.toString() === questionId
    );

    if (answerIndex !== -1) {
      attempt.answers[answerIndex].selectedOptionIndex =
        selectedOptionIndex !== undefined ? selectedOptionIndex : attempt.answers[answerIndex].selectedOptionIndex;
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

// @desc    Record anti-cheating tab switch / focus loss violation
// @route   POST /api/attempts/:id/violation
// @access  Private (Student)
const recordViolation = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const { type, details } = req.body;

    const attempt = await TestAttempt.findById(attemptId).populate('testId');
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

    await logAudit(
      req,
      'TAB_VIOLATION',
      `Violation #${attempt.violationCount} (${type}) during test "${attempt.testId?.title}"`
    );

    let isAutoSubmitted = false;
    // Strict requirement: 3rd violation triggers auto-submission!
    if (attempt.violationCount >= 3) {
      attempt.status = 'auto_submitted_violation';
      attempt.submittedAt = new Date();

      // Calculate score & lock
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

    await logAudit(
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

// Helper: Calculate scores, negative marking, and accuracy
async function evaluateAttemptScores(attempt) {
  const test = await Test.findById(attempt.testId);
  const questions = await Question.find({ testId: attempt.testId });

  let totalScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let attemptedCount = 0;
  let totalMaxMarks = 0;

  const negativeRate = test ? test.negativeMarkingRate || 0 : 0;

  questions.forEach((q) => {
    totalMaxMarks += q.marks;
    const studentAns = attempt.answers.find(
      (a) => a.questionId.toString() === q._id.toString()
    );

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

  // Ensure score doesn't go below 0
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
      });

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    // Verify permission: Student owner OR Test Teacher OR Admin
    const isStudentOwner = attempt.studentId._id.toString() === req.user._id.toString();
    const isTeacherOwner =
      req.user.role === 'teacher' &&
      attempt.testId.teacherId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isStudentOwner && !isTeacherOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this result' });
    }

    // Fetch full questions with correct answers & explanations for post-submission review
    const questions = await Question.find({ testId: attempt.testId._id }).sort({ order: 1 });

    const questionResults = questions.map((q) => {
      const ans = attempt.answers.find(
        (a) => a.questionId.toString() === q._id.toString()
      );
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
      .sort({ createdAt: -1 });

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  startAttempt,
  autoSaveAnswer,
  recordViolation,
  submitAttempt,
  getAttemptResult,
  getMyHistory,
};
