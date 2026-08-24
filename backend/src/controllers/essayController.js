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
      return res.status(404).json({ message: 'Test not found or no longer available.' });
    }

    let submission = await EssaySubmission.findOne({ testId, studentId });

    if (submission && submission.status !== 'in_progress') {
      return res.status(400).json({ message: 'You have already attempted this test.' });
    }

    if (submission && submission.status === 'in_progress') {
      return res.json(submission);
    }

    // MANDATORY CODE VERIFICATION FOR NEW ESSAY SUBMISSIONS
    const { code } = req.body || {};
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return res.status(400).json({ message: 'Please enter the test code.' });
    }

    if (code.trim().length !== 4) {
      return res.status(400).json({ message: 'Test code must be 4 characters.' });
    }

    const testStatus = test.status || 'DRAFT';
    if (testStatus === 'DRAFT') {
      return res.status(400).json({ message: 'Test has not started yet.' });
    }
    if (testStatus === 'ENDED') {
      return res.status(400).json({ message: 'Test has ended.' });
    }

    if (!test.testCode || test.testCode.toUpperCase() !== code.trim().toUpperCase()) {
      return res.status(400).json({ message: 'Invalid test code. Please enter the correct test code.' });
    }

    submission = await EssaySubmission.create({
      testId,
      studentId,
      maxMarks: test.totalMarks || 20,
      status: 'in_progress',
      submissionType: 'NORMAL_SUBMISSION',
    });
    await logAudit(req, 'ESSAY_STARTED', `Student started writing essay for test "${test.title}"`);

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

    const test = await Test.findById(submission.testId).select('status').lean();
    if (test && test.status === 'ENDED') {
      return res.status(400).json({ message: 'Test has ended. Further changes are not allowed.' });
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

    const submission = await EssaySubmission.findById(id).populate('testId', 'title status');
    if (!submission || submission.studentId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Essay submission not found' });
    }

    if (submission.status !== 'in_progress') {
      return res.json({
        success: true,
        message: 'Essay is already submitted',
        submissionId: submission._id,
        testId: submission.testId?._id || submission.testId,
        alreadySubmitted: true,
        submission,
      });
    }

    if (submission.testId && submission.testId.status === 'ENDED') {
      return res.status(400).json({ message: 'Test has ended. Further changes are not allowed.' });
    }

    if (essayText !== undefined) {
      const text = essayText || '';
      submission.essayText = text;
      submission.wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
      submission.characterCount = text.length;
    }
    if (timeSpentSeconds) submission.timeSpentSeconds = timeSpentSeconds;

    submission.status = 'submitted';
    submission.submissionType = 'NORMAL_SUBMISSION';
    submission.submittedAt = new Date();

    await submission.save();
    await logAudit(
      req,
      'ESSAY_SUBMITTED',
      `Submitted essay for "${submission.testId?.title}" (${submission.wordCount} words)`
    );

    res.json({
      success: true,
      message: 'Essay submitted successfully and sent for teacher evaluation',
      submissionId: submission._id,
      testId: submission.testId?._id || submission.testId,
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
        select: 'title testCode subjectId totalMarks durationMinutes status',
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
        select: 'title description subjectId instructions testCode',
        populate: { path: 'subjectId', select: 'name code' },
      })
      .populate('evaluatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export student essay submission to Microsoft Word (.docx)
// @route   GET /api/essays/submissions/:id/export
// @access  Private (Teacher / Admin)
const exportEssayDocx = async (req, res) => {
  try {
    const { id } = req.params;
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } = require('docx');

    const submission = await EssaySubmission.findById(id)
      .populate('studentId', 'name email rollNo')
      .populate({
        path: 'testId',
        select: 'title testCode teacherId subjectId totalMarks',
        populate: { path: 'subjectId', select: 'name code' },
      });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Teacher ownership check
    if (
      req.user.role === 'teacher' &&
      submission.testId?.teacherId &&
      submission.testId.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied: You can only export essays for your own tests' });
    }

    const testTitle = submission.testId?.title || 'Essay Test';
    const studentName = submission.studentId?.name || 'Unknown Student';
    const studentEmail = submission.studentId?.email || 'N/A';
    const testCode = submission.testId?.testCode || 'N/A';
    const submissionType = submission.submissionType || 'NORMAL_SUBMISSION';
    const submittedAtStr = submission.submittedAt
      ? new Date(submission.submittedAt).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : 'N/A';

    const rawText = submission.essayText || 'No text submitted.';
    const lines = rawText.split('\n');

    const essayParagraphs = lines.map(
      (line) =>
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              size: 24, // 12pt
              font: 'Calibri',
            }),
          ],
          spacing: { after: 140 },
        })
    );

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "STUDENT ESSAY SUBMISSION REPORT",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 240 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Essay Test: ${testTitle}`,
                  bold: true,
                  size: 28,
                  font: 'Calibri',
                  color: '1E293B',
                }),
              ],
              spacing: { after: 240 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Student Name:", bold: true })] })],
                      width: { size: 30, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: studentName })] })],
                      width: { size: 70, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Student Email / ID:", bold: true })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: studentEmail })] })],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Test Code:", bold: true })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: testCode })] })],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Submission Type:", bold: true })] })],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: submissionType,
                              bold: true,
                              color: submissionType === 'AUTO_SUBMITTED' ? 'DC2626' : '166534',
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Submitted At:", bold: true })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: submittedAtStr })] })],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Word Count:", bold: true })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: `${submission.wordCount || 0} words` })] })],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "_________________________________________________________________________________",
                  color: "CBD5E1",
                }),
              ],
              spacing: { before: 240, after: 280 },
            }),

            new Paragraph({
              text: "Student Essay Answer",
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 200 },
            }),

            ...essayParagraphs,
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const safeStudentName = studentName.replace(/[^a-zA-Z0-9]/g, '_');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=Essay-${safeStudentName}-${testCode}.docx`);
    res.send(buffer);
  } catch (error) {
    console.error('Error generating DOCX:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete essay submission (Hard delete from database)
// @route   DELETE /api/essays/submissions/:id
// @access  Private (Teacher / Admin)
const deleteEssaySubmission = async (req, res) => {
  try {
    const submission = await EssaySubmission.findById(req.params.id).populate('testId', 'teacherId title');
    if (!submission) {
      return res.status(404).json({ message: 'Essay submission not found or no longer available.' });
    }

    if (
      req.user.role === 'teacher' &&
      submission.testId?.teacherId?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied: You cannot delete another teacher\'s essay submission' });
    }

    await EssaySubmission.findByIdAndDelete(req.params.id);
    await logAudit(req, 'ESSAY_DELETE', `Deleted essay submission ${req.params.id}`);

    res.json({ message: 'Essay submission permanently deleted from database' });
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
  exportEssayDocx,
  deleteEssaySubmission,
};
