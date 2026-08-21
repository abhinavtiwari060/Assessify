const mongoose = require('mongoose');

const testAttemptSchema = new mongoose.Schema(
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
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
          required: true,
        },
        selectedOptionIndex: {
          type: Number,
          default: null,
        },
        timeSpentSeconds: {
          type: Number,
          default: 0,
        },
        isCorrect: {
          type: Boolean,
          default: false,
        },
        marksAwarded: {
          type: Number,
          default: 0,
        },
        isFlagged: {
          type: Boolean,
          default: false,
        },
      },
    ],
    score: {
      type: Number,
      default: 0,
    },
    maxMarks: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0, // percentage 0-100
    },
    attemptedCount: {
      type: Number,
      default: 0,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    wrongCount: {
      type: Number,
      default: 0,
    },
    timeTakenSeconds: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'auto_submitted_violation', 'auto_submitted_timer'],
      default: 'in_progress',
    },
    violations: [
      {
        timestamp: { type: Date, default: Date.now },
        type: { type: String, required: true }, // 'visibilitychange' | 'blur' | 'fullscreenchange'
        details: { type: String, default: '' },
      },
    ],
    violationCount: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
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

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
