const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
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
      required: true,
      trim: true,
    },
    instructions: {
      type: String,
      default: "",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 1,
      default: 100,
    },
    allowedFileTypes: {
      type: [String],
      default: ["pdf", "doc", "docx", "zip"],
    },
    maxFileSizeMB: {
      type: Number,
      default: 10,
      min: 1,
      max: 50,
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

module.exports = mongoose.model("Assignment", assignmentSchema);