const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        selectedAnswer: {
          type: Number,
          required: true,
        },
      },
    ],
    score: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    attemptNumber: {
      type: Number,
      required: true,
    },
    cycleNumber: {
       type: Number,
       default: 1
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ quiz: 1, student: 1 });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);