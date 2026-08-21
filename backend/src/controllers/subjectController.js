const Subject = require('../models/Subject');
const Test = require('../models/Test');
const { logAudit } = require('../middleware/auth');

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Public / Private
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().populate('createdBy', 'name email').sort({ name: 1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a subject
// @route   POST /api/subjects
// @access  Private (Teacher/Admin)
const createSubject = async (req, res) => {
  try {
    const { name, code, description, iconName } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: 'Subject name and unique code are required' });
    }

    const existingCode = await Subject.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ message: 'Subject with this code already exists' });
    }

    const subject = await Subject.create({
      name,
      code: code.toUpperCase(),
      description: description || '',
      iconName: iconName || 'BookOpen',
      createdBy: req.user._id,
    });

    await logAudit(req, 'SUBJECT_CREATE', `Created subject ${subject.name} (${subject.code})`);
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Private (Admin or Creator Teacher)
const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    if (req.user.role !== 'admin' && subject.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this subject' });
    }

    subject.name = req.body.name || subject.name;
    subject.description = req.body.description !== undefined ? req.body.description : subject.description;
    subject.iconName = req.body.iconName || subject.iconName;
    if (req.body.code) subject.code = req.body.code.toUpperCase();

    const updated = await subject.save();
    await logAudit(req, 'SUBJECT_UPDATE', `Updated subject ${updated.name}`);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
// @access  Private (Admin only)
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if any tests use this subject
    const testCount = await Test.countDocuments({ subjectId: req.params.id });
    if (testCount > 0) {
      return res.status(400).json({
        message: `Cannot delete subject because ${testCount} tests are currently associated with it`,
      });
    }

    await subject.deleteOne();
    await logAudit(req, 'SUBJECT_DELETE', `Deleted subject ${subject.name}`);
    res.json({ message: 'Subject removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSubjects, createSubject, updateSubject, deleteSubject };
