const mongoose = require('mongoose');

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Test title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['mcq', 'essay'],
      default: 'mcq',
    },
    timerMode: {
      type: String,
      enum: ['none', 'question', 'full'],
      default: 'full',
    },
    durationMinutes: {
      type: Number,
      default: 30,
    },
    perQuestionSeconds: {
      type: Number,
      default: 60,
    },
    isSequential: {
      type: Boolean,
      default: false,
    },
    maxAttempts: {
      type: Number,
      default: 1,
    },
    passingPercentage: {
      type: Number,
      default: 40,
    },
    negativeMarkingRate: {
      type: Number,
      default: 0, // e.g., 0.25 for 0.25 negative marks per wrong answer
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    instructions: {
      type: String,
      default: 'Read all questions carefully. Do not switch tabs during the test.',
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast published test queries and subject filtering
testSchema.index({ isPublished: 1, type: 1 });
testSchema.index({ subjectId: 1, isPublished: 1 });

module.exports = mongoose.model('Test', testSchema);
