const EssaySubmission = require('../models/EssaySubmission');
const Test = require('../models/Test');
const { logAudit } = require('../middleware/auth');

// @desc    Start or resume essay writing session
// @route   POST /api/essays/:testId/start
// @access  Private (Student)
const startEssay = async (req, res) => {
  try {
    const { testId } = req.params;
    const studentId = req.user._id;

    const test = await Test.findById(testId);
    if (!test || test.type !== 'essay') {
      return res.status(400).json({ message: 'Invalid essay test' });
    }

    let submission = await EssaySubmission.findOne({ testId, studentId });

    if (!submission) {
      submission = await EssaySubmission.create({
        testId,
        studentId,
        maxMarks: test.totalMarks || 20,
        status: 'in_progress',
      });
      await logAudit(req, 'ESSAY_STARTED', `Student started writing essay for test "${test.title}"`);
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Autosave essay content during writing
// @route   PUT /api/essays/submissions/:id/save
// @access  Private (Student)
const autoSaveEssay = async (req, res) => {
  try {
    const { id } = req.params;
    const { essayText, timeSpentSeconds } = req.body;

    const submission = await EssaySubmission.findById(id);
    if (!submission || submission.studentId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Essay submission not found' });
    }

    if (submission.status !== 'in_progress') {
      return res.status(400).json({ message: 'Essay has already been submitted and locked' });
    }

    const text = essayText || '';
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

    submission.essayText = text;
    submission.wordCount = words;
    submission.characterCount = text.length;
    if (timeSpentSeconds) submission.timeSpentSeconds = timeSpentSeconds;

    await submission.save();
    res.json({
      message: 'Essay autosaved successfully',
      wordCount: submission.wordCount,
      characterCount: submission.characterCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit essay final
// @route   POST /api/essays/submissions/:id/submit
// @access  Private (Student)
const submitEssay = async (req, res) => {
  try {
    const { id } = req.params;
    const { essayText, timeSpentSeconds } = req.body;

    const submission = await EssaySubmission.findById(id).populate('testId', 'title');
    if (!submission || submission.studentId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Essay submission not found' });
    }

    if (submission.status !== 'in_progress') {
      return res.status(400).json({ message: 'Essay is already submitted' });
    }

    if (essayText !== undefined) {
      const text = essayText || '';
      submission.essayText = text;
      submission.wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
      submission.characterCount = text.length;
    }
    if (timeSpentSeconds) submission.timeSpentSeconds = timeSpentSeconds;

    submission.status = 'submitted';
    submission.submittedAt = new Date();

    await submission.save();
    await logAudit(
      req,
      'ESSAY_SUBMITTED',
      `Submitted essay for "${submission.testId?.title}" (${submission.wordCount} words)`
    );

    res.json({
      message: 'Essay submitted successfully and sent for teacher evaluation',
      submission,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get essay submissions for teacher's tests (Teacher Data Isolation!)
// @route   GET /api/essays/teacher/submissions
// @access  Private (Teacher / Admin)
const getTeacherSubmissions = async (req, res) => {
  try {
    let testFilter = {};
    if (req.user.role === 'teacher') {
      // Find tests created by logged-in teacher
      const teacherTests = await Test.find({ teacherId: req.user._id, type: 'essay' }).select('_id');
      const testIds = teacherTests.map((t) => t._id);
      testFilter.testId = { $in: testIds };
    }

    const submissions = await EssaySubmission.find(testFilter)
      .populate('studentId', 'name email avatar')
      .populate({
        path: 'testId',
        select: 'title subjectId totalMarks durationMinutes',
        populate: { path: 'subjectId', select: 'name code' },
      })
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Evaluate essay submission (Grade marks & write feedback)
// @route   POST /api/essays/submissions/:id/evaluate
// @access  Private (Teacher / Admin)
const evaluateEssay = async (req, res) => {
  try {
    const { id } = req.params;
    const { marksObtained, feedback, internalNotes } = req.body;

    const submission = await EssaySubmission.findById(id).populate('testId');
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Teacher ownership check
    if (
      req.user.role === 'teacher' &&
      submission.testId.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied: You cannot evaluate essays for another teacher\'s test' });
    }

    if (marksObtained === undefined || marksObtained < 0) {
      return res.status(400).json({ message: 'Valid marksObtained is required' });
    }

    submission.marksObtained = Math.min(Number(marksObtained), submission.maxMarks);
    submission.feedback = feedback || '';
    submission.internalNotes = internalNotes || '';
    submission.status = 'evaluated';
    submission.evaluatedBy = req.user._id;
    submission.evaluatedAt = new Date();

    await submission.save();
    await logAudit(
      req,
      'ESSAY_EVALUATED',
      `Evaluated essay for student ${submission.studentId}: ${submission.marksObtained}/${submission.maxMarks} marks`
    );

    res.json({
      message: 'Essay evaluation saved successfully',
      submission,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student's own essay submissions
// @route   GET /api/essays/my-submissions
// @access  Private (Student)
const getMyEssaySubmissions = async (req, res) => {
  try {
    const submissions = await EssaySubmission.find({ studentId: req.user._id })
      .populate({
        path: 'testId',
        select: 'title description subjectId instructions',
        populate: { path: 'subjectId', select: 'name code' },
      })
      .populate('evaluatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  startEssay,
  autoSaveEssay,
  submitEssay,
  getTeacherSubmissions,
  evaluateEssay,
  getMyEssaySubmissions,
};
