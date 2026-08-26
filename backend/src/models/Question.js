const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
      index: true,
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      type: [String],
      required: [true, 'At least 2 options are required'],
      validate: [
        (arr) => Array.isArray(arr) && arr.length >= 2,
        'Questions must have at least 2 options',
      ],
    },
    correctAnswerIndex: {
      type: Number,
      required: [true, 'Correct answer index is required'],
    },
    marks: {
      type: Number,
      default: 1,
    },
    explanation: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['mcq', 'comprehension'],
      default: 'mcq',
    },
    passage: {
      type: String,
      default: '',
    },
    passageId: {
      type: String,
      default: null,
      index: true,
    },
    timerSeconds: {
      type: Number,
      default: null, // If set, overrides test perQuestionSeconds
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for sorted question fetching during exam loading
questionSchema.index({ testId: 1, order: 1 });

module.exports = mongoose.model('Question', questionSchema);
