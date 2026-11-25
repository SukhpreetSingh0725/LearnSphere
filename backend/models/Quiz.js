const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (options) => options.length >= 2,
      message: "At least two options are required",
    },
  },
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
  },
});

const quizSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    questions: [questionSchema],
    passingScore: {
      type: Number,
      default: 60,
      min: 0,
      max: 100,
    },
    maxAttempts: {
      type: Number,
      default: 3,
      min: 1,
    },
    attemptCooldownHours: {
      type: Number,
      default: 24,
      min: 0,
      max: 720,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);