const Test = require('../models/Test');
const Question = require('../models/Question');
const TestAttempt = require('../models/TestAttempt');
const EssaySubmission = require('../models/EssaySubmission');
const { logAudit } = require('../middleware/auth');
const { generateUniqueTestCode } = require('../utils/codeGenerator');
const { evaluateAttemptScores } = require('./attemptController');

// @desc    Get tests (Student gets published, Teacher gets own, Admin gets all)
// @route   GET /api/tests
// @access  Private
// @desc    Get tests (Student gets published, Teacher gets own, Admin gets all) - Optimized Bulk Queries
// @route   GET /api/tests
// @access  Private
const getTests = async (req, res) => {
  try {
    const { subjectId, search, type } = req.query;
    let query = {};

    if (req.user.role === 'teacher') {
      query.teacherId = req.user._id;
    } else if (req.user.role === 'student') {
      query.isPublished = true;
    }

    if (subjectId) query.subjectId = subjectId;
    if (type) query.type = type;
    if (search) query.title = { $regex: search, $options: 'i' };

    const tests = await Test.find(query)
      .populate('subjectId', 'name code iconName')
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    if (tests.length === 0) {
      return res.json([]);
    }

    const testIds = tests.map((t) => t._id);

    // 1. Bulk aggregate question counts across all tests in 1 query
    const questionCountsAgg = await Question.aggregate([
      { $match: { testId: { $in: testIds } } },
      { $group: { _id: '$testId', count: { $sum: 1 } } },
    ]);
    const questionCountMap = new Map(questionCountsAgg.map((q) => [q._id.toString(), q.count]));

    // 2. Bulk fetch student attempts in 1 query if student
    let studentAttemptMap = new Map();
    let essaySubMap = new Map();

    if (req.user.role === 'student') {
      const attempts = await TestAttempt.find({
        testId: { $in: testIds },
        studentId: req.user._id,
        status: { $ne: 'in_progress' },
      })
        .select('testId score maxMarks accuracy')
        .sort({ score: -1 })
        .lean();

      attempts.forEach((att) => {
        const tIdStr = att.testId.toString();
        if (!studentAttemptMap.has(tIdStr)) {
          studentAttemptMap.set(tIdStr, []);
        }
        studentAttemptMap.get(tIdStr).push(att);
      });

      const essaySubs = await EssaySubmission.find({
        testId: { $in: testIds },
        studentId: req.user._id,
      }).lean();

      essaySubs.forEach((es) => {
        essaySubMap.set(es.testId.toString(), es);
      });
    }

    // Attach statistics in memory without N+1 queries
    const testsWithMetadata = tests.map((test) => {
      const tIdStr = test._id.toString();
      const questionCount = questionCountMap.get(tIdStr) || 0;
      let userAttempts = 0;
      let bestScore = null;

      if (req.user.role === 'student') {
        if (test.type === 'mcq') {
          const userAtts = studentAttemptMap.get(tIdStr) || [];
          userAttempts = userAtts.length;
          if (userAtts.length > 0) {
            bestScore = {
              score: userAtts[0].score,
              maxMarks: userAtts[0].maxMarks,
              accuracy: userAtts[0].accuracy,
            };
          }
        } else {
          const essaySub = essaySubMap.get(tIdStr);
          if (essaySub) {
            userAttempts = 1;
            if (essaySub.status === 'evaluated') {
              bestScore = {
                score: essaySub.marksObtained,
                maxMarks: essaySub.maxMarks,
              };
            }
          }
        }
      }

      return {
        ...test,
        questionCount,
        userAttempts,
        bestScore,
      };
    });

    res.json(testsWithMetadata);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Safe Server-Side In-Memory Cache for sanitized student test definitions
const studentTestCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

function invalidateTestCache(testId) {
  if (testId) {
    studentTestCache.delete(testId.toString());
  }
}

// @desc    Get single test details (High-Concurrency Optimized)
// @route   GET /api/tests/:id
// @access  Private
const getTestById = async (req, res) => {
  const startTime = Date.now();
  const testIdStr = req.params.id;

  try {
    // 1. FAST PATH: Check safe in-memory cache for student users
    if (req.user.role === 'student') {
      const cached = studentTestCache.get(testIdStr);
      if (cached && cached.expiresAt > Date.now()) {
        const totalDuration = Date.now() - startTime;
        console.log(`⚡ [Test API Cache HIT] testId=${testIdStr} | total=${totalDuration}ms`);
        return res.json(cached.data);
      }
    }

    // 2. DB Query for Test
    const t0 = Date.now();
    let testQuery;

    if (req.user.role === 'teacher') {
      testQuery = Test.findById(testIdStr)
        .populate('subjectId', 'name code iconName')
        .populate('teacherId', 'name email')
        .lean();
    } else {
      // Students don't need teacherId populated
      testQuery = Test.findById(testIdStr)
        .populate('subjectId', 'name code iconName')
        .select('title description type timerMode durationMinutes perQuestionSeconds isSequential maxAttempts passingPercentage negativeMarkingRate instructions totalMarks isPublished status testCode startedAt endedAt subjectId')
        .lean();
    }

    const test = await testQuery;
    const testQueryDuration = Date.now() - t0;

    if (!test || (!test.isPublished && req.user.role === 'student')) {
      return res.status(404).json({ message: 'Test not found or unavailable' });
    }

    if (
      req.user.role === 'teacher' &&
      test.teacherId?._id?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied: You can only access your own created tests' });
    }

    // 3. DB Query for Questions with exact index-scan sort clause { order: 1 }
    const t1 = Date.now();
    let questionQuery = Question.find({ testId: test._id }).sort({ order: 1 }).lean();

    if (req.user.role === 'student') {
      questionQuery = questionQuery.select('_id testId questionText options marks timerSeconds order');
    }

    const questions = await questionQuery;
    const questionQueryDuration = Date.now() - t1;

    const responsePayload = {
      ...test,
      questions,
    };

    // 4. Store in safe student test cache if student role
    if (req.user.role === 'student') {
      studentTestCache.set(testIdStr, {
        data: responsePayload,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
    }

    const totalDuration = Date.now() - startTime;
    console.log(
      `📊 [Test API DB MISS] testId=${testIdStr} | total=${totalDuration}ms | testQuery=${testQueryDuration}ms | questionQuery=${questionQueryDuration}ms`
    );

    res.json(responsePayload);
  } catch (error) {
    console.error(`❌ [Test API Error] testId=${testIdStr} | error=${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new test
// @route   POST /api/tests
// @access  Private (Teacher / Admin)
const createTest = async (req, res) => {
  try {
    const {
      title,
      description,
      subjectId,
      type,
      timerMode,
      durationMinutes,
      perQuestionSeconds,
      isSequential,
      maxAttempts,
      passingPercentage,
      negativeMarkingRate,
      instructions,
      isPublished,
      questions,
    } = req.body;

    if (!title || !subjectId) {
      return res.status(400).json({ message: 'Title and Subject are required' });
    }

    const testCode = await generateUniqueTestCode();

    const newTest = await Test.create({
      title,
      description: description || '',
      subjectId,
      teacherId: req.user._id, // Enforce logged in teacher ownership!
      type: type || 'mcq',
      timerMode: timerMode || 'full',
      durationMinutes: durationMinutes || 30,
      perQuestionSeconds: perQuestionSeconds || 60,
      isSequential: Boolean(isSequential),
      maxAttempts: maxAttempts || 1,
      passingPercentage: passingPercentage || 40,
      negativeMarkingRate: negativeMarkingRate || 0,
      instructions: instructions || 'Read all questions carefully.',
      isPublished: isPublished !== undefined ? isPublished : true,
      testCode,
      status: 'DRAFT',
    });

    let totalMarks = 0;

    // Create questions if provided
    if (Array.isArray(questions) && questions.length > 0) {
      const questionDocs = questions.map((q, idx) => {
        const marks = Number(q.marks) || 1;
        totalMarks += marks;
        return {
          testId: newTest._id,
          questionText: q.questionText,
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex || 0,
          marks,
          explanation: q.explanation || '',
          timerSeconds: q.timerSeconds || null,
          order: idx,
        };
      });

      await Question.insertMany(questionDocs);
    } else if (newTest.type === 'essay') {
      totalMarks = req.body.totalMarks || 20;
    }

    newTest.totalMarks = totalMarks;
    await newTest.save();

    await logAudit(req, 'TEST_CREATE', `Created test "${newTest.title}" (${newTest.type.toUpperCase()})`);

    res.status(201).json(newTest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update test
// @route   PUT /api/tests/:id
// @access  Private (Teacher / Admin)
const updateTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Teacher ownership check
    if (
      req.user.role === 'teacher' &&
      test.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied: You cannot edit another teacher\'s test' });
    }

    const fields = [
      'title',
      'description',
      'subjectId',
      'type',
      'timerMode',
      'durationMinutes',
      'perQuestionSeconds',
      'isSequential',
      'maxAttempts',
      'passingPercentage',
      'negativeMarkingRate',
      'instructions',
      'isPublished',
      'totalMarks',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        test[field] = req.body[field];
      }
    });

    // If questions array is passed, overwrite questions
    if (Array.isArray(req.body.questions)) {
      await Question.deleteMany({ testId: test._id });

      let calculatedTotalMarks = 0;
      const newQuestionDocs = req.body.questions.map((q, idx) => {
        const marks = Number(q.marks) || 1;
        calculatedTotalMarks += marks;
        return {
          testId: test._id,
          questionText: q.questionText,
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex || 0,
          marks,
          explanation: q.explanation || '',
          timerSeconds: q.timerSeconds || null,
          order: idx,
        };
      });

      await Question.insertMany(newQuestionDocs);
      if (test.type === 'mcq') {
        test.totalMarks = calculatedTotalMarks;
      }
    }

    const updatedTest = await test.save();
    invalidateTestCache(test._id);
    await logAudit(req, 'TEST_UPDATE', `Updated test "${updatedTest.title}"`);

    res.json(updatedTest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete test
// @route   DELETE /api/tests/:id
// @access  Private (Teacher / Admin)
const deleteTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Teacher ownership check
    if (
      req.user.role === 'teacher' &&
      test.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied: You cannot delete another teacher\'s test' });
    }

    // Delete questions, attempts, essay submissions
    await Question.deleteMany({ testId: test._id });
    await TestAttempt.deleteMany({ testId: test._id });
    await EssaySubmission.deleteMany({ testId: test._id });
    await test.deleteOne();

    invalidateTestCache(test._id);
    await logAudit(req, 'TEST_DELETE', `Deleted test "${test.title}"`);

    res.json({ message: 'Test and associated questions/attempts removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Start test session (Teacher manually starts test)
// @route   POST /api/tests/:id/start-session
// @access  Private (Teacher / Admin)
const startTestSession = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    if (req.user.role === 'teacher' && test.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: You can only start your own test' });
    }

    if (test.status === 'ENDED') {
      return res.status(400).json({ message: 'Cannot start a test that has already ended' });
    }

    test.status = 'STARTED';
    test.startedAt = new Date();
    test.isPublished = true;
    await test.save();

    invalidateTestCache(test._id);
    await logAudit(req, 'TEST_STARTED_BY_TEACHER', `Teacher started test "${test.title}" (Code: ${test.testCode})`);

    res.json({ message: 'Test started successfully', test });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    End test session (Teacher manually ends test and auto-submits active attempts)
// @route   POST /api/tests/:id/end-session
// @access  Private (Teacher / Admin)
const endTestSession = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    if (req.user.role === 'teacher' && test.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: You can only end your own test' });
    }

    // Idempotent: If already ENDED, return success
    if (test.status === 'ENDED') {
      return res.json({ message: 'Test is already ended', test });
    }

    test.status = 'ENDED';
    test.endedAt = new Date();
    await test.save();

    invalidateTestCache(test._id);

    // Auto-submit all active MCQ test attempts
    const activeMcqAttempts = await TestAttempt.find({
      testId: test._id,
      status: 'in_progress',
    });

    for (const attempt of activeMcqAttempts) {
      attempt.status = 'auto_submitted';
      attempt.submissionType = 'AUTO_SUBMITTED';
      attempt.submittedAt = new Date();
      await evaluateAttemptScores(attempt);
      await attempt.save();
    }

    // Auto-submit all active Essay test submissions
    const activeEssaySubs = await EssaySubmission.find({
      testId: test._id,
      status: 'in_progress',
    });

    for (const sub of activeEssaySubs) {
      sub.status = 'submitted';
      sub.submissionType = 'AUTO_SUBMITTED';
      sub.submittedAt = new Date();
      await sub.save();
    }

    await logAudit(
      req,
      'TEST_ENDED_BY_TEACHER',
      `Teacher ended test "${test.title}". Auto-submitted ${activeMcqAttempts.length} MCQ attempts and ${activeEssaySubs.length} Essay submissions.`
    );

    res.json({
      message: 'Test ended successfully. Active student attempts have been auto-submitted.',
      autoSubmittedMcqCount: activeMcqAttempts.length,
      autoSubmittedEssayCount: activeEssaySubs.length,
      test,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify 4-character test code before student starts test
// @route   POST /api/tests/:id/verify-code
// @access  Private (Student)
const verifyTestCode = async (req, res) => {
  try {
    const { code } = req.body;
    const testId = req.params.id;
    const studentId = req.user._id;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ message: 'Test code is required' });
    }

    const test = await Test.findById(testId).lean();
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // 1. Check if test code matches (case insensitive check)
    if (!test.testCode || test.testCode.toUpperCase() !== code.trim().toUpperCase()) {
      return res.status(400).json({ message: 'Invalid test code.' });
    }

    // 2. Check test status
    const currentStatus = test.status || 'DRAFT';
    if (currentStatus === 'DRAFT') {
      return res.status(400).json({ message: 'Test has not started yet.' });
    }
    if (currentStatus === 'ENDED') {
      return res.status(400).json({ message: 'Test has ended.' });
    }

    // 3. Check if student already attempted/submitted
    if (test.type === 'mcq') {
      const completedAttempt = await TestAttempt.findOne({
        testId,
        studentId,
        status: { $ne: 'in_progress' },
      }).lean();

      if (completedAttempt) {
        return res.status(400).json({ message: 'You have already attempted this test.' });
      }
    } else if (test.type === 'essay') {
      const existingEssay = await EssaySubmission.findOne({
        testId,
        studentId,
      }).lean();

      if (existingEssay && existingEssay.status !== 'in_progress') {
        return res.status(400).json({ message: 'You have already attempted this test.' });
      }
    }

    res.json({
      verified: true,
      message: 'Test code verified successfully.',
      testId: test._id,
      testTitle: test.title,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  startTestSession,
  endTestSession,
  verifyTestCode,
};
