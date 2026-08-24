const mongoose = require('mongoose');

const essaySubmissionSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    essayText: {
      type: String,
      default: '',
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    characterCount: {
      type: Number,
      default: 0,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'auto_submitted', 'evaluated'],
      default: 'in_progress',
    },
    submissionType: {
      type: String,
      enum: ['NORMAL_SUBMISSION', 'AUTO_SUBMITTED'],
      default: 'NORMAL_SUBMISSION',
    },
    marksObtained: {
      type: Number,
      default: null,
    },
    maxMarks: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: String,
      default: '', // Public feedback visible to student
    },
    internalNotes: {
      type: String,
      default: '', // Teacher private evaluation notes
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    evaluatedAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EssaySubmission', essaySubmissionSchema);
