const Test = require('../models/Test');
const Question = require('../models/Question');
const TestAttempt = require('../models/TestAttempt');
const EssaySubmission = require('../models/EssaySubmission');
const { logAudit } = require('../middleware/auth');

// @desc    Get tests (Student gets published, Teacher gets own, Admin gets all)
// @route   GET /api/tests
// @access  Private
const getTests = async (req, res) => {
  try {
    const { subjectId, search, type } = req.query;
    let query = {};

    // Role-based filtering
    if (req.user.role === 'teacher') {
      // STRICT TEACHER DATA ISOLATION
      query.teacherId = req.user._id;
    } else if (req.user.role === 'student') {
      query.isPublished = true;
    }

    if (subjectId) {
      query.subjectId = subjectId;
    }
    if (type) {
      query.type = type;
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const tests = await Test.find(query)
      .populate('subjectId', 'name code iconName')
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });

    // Attach question counts and student attempt stats if student
    const testsWithMetadata = await Promise.all(
      tests.map(async (test) => {
        const questionCount = await Question.countDocuments({ testId: test._id });
        let userAttempts = 0;
        let bestScore = null;

        if (req.user.role === 'student') {
          if (test.type === 'mcq') {
            const attempts = await TestAttempt.find({
              testId: test._id,
              studentId: req.user._id,
              status: { $ne: 'in_progress' },
            }).sort({ score: -1 });

            userAttempts = attempts.length;
            if (attempts.length > 0) {
              bestScore = {
                score: attempts[0].score,
                maxMarks: attempts[0].maxMarks,
                accuracy: attempts[0].accuracy,
              };
            }
          } else {
            const essaySub = await EssaySubmission.findOne({
              testId: test._id,
              studentId: req.user._id,
            });
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
          ...test.toObject(),
          questionCount,
          userAttempts,
          bestScore,
        };
      })
    );

    res.json(testsWithMetadata);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single test details
// @route   GET /api/tests/:id
// @access  Private
const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('subjectId', 'name code iconName')
      .populate('teacherId', 'name email');

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Teacher ownership isolation check
    if (
      req.user.role === 'teacher' &&
      test.teacherId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied: You can only access your own created tests' });
    }

    // Fetch questions
    const questions = await Question.find({ testId: test._id }).sort({ order: 1, createdAt: 1 });

    // Sanitization: If student is fetching test before or during attempt, omit correctAnswerIndex & explanation!
    let sanitizedQuestions = questions;
    if (req.user.role === 'student') {
      sanitizedQuestions = questions.map((q) => ({
        _id: q._id,
        testId: q.testId,
        questionText: q.questionText,
        options: q.options,
        marks: q.marks,
        timerSeconds: q.timerSeconds,
        order: q.order,
      }));
    }

    res.json({
      ...test.toObject(),
      questions: sanitizedQuestions,
    });
  } catch (error) {
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

    await logAudit(req, 'TEST_DELETE', `Deleted test "${test.title}"`);

    res.json({ message: 'Test and associated questions/attempts removed' });
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
};
