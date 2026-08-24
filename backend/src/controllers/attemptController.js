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

    // 1. Lean Test Lookup selecting required fields
    const test = await Test.findById(testId)
      .select('title isPublished status testCode maxAttempts totalMarks')
      .lean();

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    const testStatus = test.status || 'DRAFT';
    if (testStatus === 'DRAFT') {
      return res.status(400).json({ message: 'Test has not started yet.' });
    }
    if (testStatus === 'ENDED') {
      return res.status(400).json({ message: 'Test has ended.' });
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

    if (completedAttempts >= (test.maxAttempts || 1)) {
      return res.status(400).json({
        message: 'You have already attempted this test.',
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
    .select('negativeMarkingRate passingPercentage')
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
  const passingPercentage = test ? test.passingPercentage || 40 : 40;
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

  const finalScore = Math.max(0, Math.round(totalScore * 100) / 100);
  const totalQuestions = questions.length;
  const unansweredCount = Math.max(0, totalQuestions - attemptedCount);
  const percentage = totalMaxMarks > 0 ? Math.round((finalScore / totalMaxMarks) * 10000) / 100 : 0;
  const isPassed = percentage >= passingPercentage;

  attempt.score = finalScore;
  attempt.maxMarks = totalMaxMarks;
  attempt.attemptedCount = attemptedCount;
  attempt.correctCount = correctCount;
  attempt.wrongCount = wrongCount;
  attempt.totalQuestions = totalQuestions;
  attempt.unansweredCount = unansweredCount;
  attempt.percentage = percentage;
  attempt.isPassed = isPassed;
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
        select: 'title type subjectId durationMinutes passingPercentage',
        populate: { path: 'subjectId', select: 'name code iconName' },
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: Format duration seconds to string (e.g. 07m 30s)
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

// @desc    Get Student Test Reports for Teacher / Admin
// @route   GET /api/attempts/reports
// @access  Private (Teacher / Admin)
const getTeacherStudentReports = async (req, res) => {
  try {
    const xlsx = require('xlsx'); // verify requirement
    const {
      search,
      testId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'submittedAt',
      sortOrder = 'desc',
    } = req.query;

    let testFilter = {};
    if (req.user.role === 'teacher') {
      const myTests = await Test.find({ teacherId: req.user._id }).select('_id').lean();
      const myTestIds = myTests.map((t) => t._id);
      testFilter.testId = { $in: myTestIds };
    }

    if (testId) {
      testFilter.testId = testId;
    }

    let query = {
      status: { $ne: 'in_progress' },
      ...testFilter,
    };

    if (startDate || endDate) {
      query.submittedAt = {};
      if (startDate) query.submittedAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.submittedAt.$lte = end;
      }
    }

    let attempts = await TestAttempt.find(query)
      .populate('studentId', 'name email rollNo avatar')
      .populate({
        path: 'testId',
        select: 'title subjectId passingPercentage totalMarks',
        populate: { path: 'subjectId', select: 'name code' },
      })
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .lean();

    // In-memory filter for status & search
    if (status && status !== 'all') {
      attempts = attempts.filter((att) => {
        const passingRate = att.testId?.passingPercentage || 40;
        const pct = att.percentage !== undefined ? att.percentage : att.accuracy;
        const passed = att.isPassed !== undefined ? att.isPassed : pct >= passingRate;
        return status === 'passed' ? passed : !passed;
      });
    }

    if (search && search.trim() !== '') {
      const term = search.trim().toLowerCase();
      attempts = attempts.filter((att) => {
        const nameMatch = att.studentId?.name?.toLowerCase().includes(term);
        const emailMatch = att.studentId?.email?.toLowerCase().includes(term);
        const testMatch = att.testId?.title?.toLowerCase().includes(term);
        return nameMatch || emailMatch || testMatch;
      });
    }

    const total = attempts.length;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedAttempts = attempts.slice(startIndex, startIndex + limitNum);

    const formattedReports = paginatedAttempts.map((att) => {
      const totalQs = att.totalQuestions || att.answers?.length || 0;
      const attempted = att.attemptedCount || 0;
      const correct = att.correctCount || 0;
      const wrong = att.wrongCount || 0;
      const unanswered = att.unansweredCount !== undefined ? att.unansweredCount : Math.max(0, totalQs - attempted);
      const passingRate = att.testId?.passingPercentage || 40;
      const pct = att.percentage !== undefined ? att.percentage : att.accuracy;
      const isPassed = att.isPassed !== undefined ? att.isPassed : pct >= passingRate;

      return {
        _id: att._id,
        studentId: att.studentId?._id,
        studentName: att.studentId?.name || 'Unknown Student',
        studentEmail: att.studentId?.email || 'N/A',
        studentAvatar: att.studentId?.avatar || '',
        testId: att.testId?._id,
        testName: att.testId?.title || 'MCQ Exam',
        subjectName: att.testId?.subjectId?.name || 'General',
        totalQuestions: totalQs,
        attempted,
        correct,
        wrong,
        unanswered,
        score: att.score,
        maxMarks: att.maxMarks,
        accuracy: att.accuracy,
        percentage: pct,
        timeTakenSeconds: att.timeTakenSeconds || 0,
        timeTakenFormatted: formatDuration(att.timeTakenSeconds),
        status: isPassed ? 'Passed' : 'Needs Improvement',
        isPassed,
        violationCount: att.violationCount || 0,
        submittedAt: att.submittedAt || att.createdAt,
      };
    });

    res.json({
      reports: formattedReports,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export Student Test Reports to Excel (.xlsx)
// @route   GET /api/attempts/reports/export
// @access  Private (Teacher / Admin)
const exportStudentReportsExcel = async (req, res) => {
  try {
    const xlsx = require('xlsx');
    const { search, testId, status, startDate, endDate } = req.query;

    let testFilter = {};
    if (req.user.role === 'teacher') {
      const myTests = await Test.find({ teacherId: req.user._id }).select('_id').lean();
      const myTestIds = myTests.map((t) => t._id);
      testFilter.testId = { $in: myTestIds };
    }

    if (testId) {
      testFilter.testId = testId;
    }

    let query = {
      status: { $ne: 'in_progress' },
      ...testFilter,
    };

    if (startDate || endDate) {
      query.submittedAt = {};
      if (startDate) query.submittedAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.submittedAt.$lte = end;
      }
    }

    let attempts = await TestAttempt.find(query)
      .populate('studentId', 'name email rollNo')
      .populate({
        path: 'testId',
        select: 'title subjectId passingPercentage totalMarks',
      })
      .sort({ submittedAt: -1 })
      .lean();

    if (status && status !== 'all') {
      attempts = attempts.filter((att) => {
        const passingRate = att.testId?.passingPercentage || 40;
        const pct = att.percentage !== undefined ? att.percentage : att.accuracy;
        const passed = att.isPassed !== undefined ? att.isPassed : pct >= passingRate;
        return status === 'passed' ? passed : !passed;
      });
    }

    if (search && search.trim() !== '') {
      const term = search.trim().toLowerCase();
      attempts = attempts.filter((att) => {
        const nameMatch = att.studentId?.name?.toLowerCase().includes(term);
        const emailMatch = att.studentId?.email?.toLowerCase().includes(term);
        const testMatch = att.testId?.title?.toLowerCase().includes(term);
        return nameMatch || emailMatch || testMatch;
      });
    }

    const excelRows = attempts.map((att) => {
      const totalQs = att.totalQuestions || att.answers?.length || 0;
      const attempted = att.attemptedCount || 0;
      const correct = att.correctCount || 0;
      const wrong = att.wrongCount || 0;
      const unanswered = att.unansweredCount !== undefined ? att.unansweredCount : Math.max(0, totalQs - attempted);
      const passingRate = att.testId?.passingPercentage || 40;
      const pct = att.percentage !== undefined ? att.percentage : att.accuracy;
      const isPassed = att.isPassed !== undefined ? att.isPassed : pct >= passingRate;

      return {
        'Student Name': att.studentId?.name || 'Unknown Student',
        'Student Email': att.studentId?.email || 'N/A',
        'Test Name': att.testId?.title || 'MCQ Exam',
        'Total Questions': totalQs,
        'Attempted': attempted,
        'Correct': correct,
        'Wrong': wrong,
        'Unanswered': unanswered,
        'Score': `${att.score} / ${att.maxMarks}`,
        'Percentage': `${pct}%`,
        'Status': isPassed ? 'Passed' : 'Needs Improvement',
        'Time Taken': formatDuration(att.timeTakenSeconds),
        'Submitted At': att.submittedAt ? new Date(att.submittedAt).toLocaleString() : 'N/A',
      };
    });

    const worksheet = xlsx.utils.json_to_sheet(excelRows);
    worksheet['!cols'] = [
      { wch: 22 },
      { wch: 28 },
      { wch: 28 },
      { wch: 15 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 18 },
      { wch: 14 },
      { wch: 22 },
    ];

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Student Reports');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const dateStr = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=student-test-reports-${dateStr}.xlsx`);
    res.send(buffer);
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
  getTeacherStudentReports,
  exportStudentReportsExcel,
  evaluateAttemptScores,
};
