const mongoose = require("mongoose");

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    textResponse: {
      type: String,
      default: "",
    },
    fileUrl: {
      type: String,
      default: "",
    },
    fileName: {
      type: String,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["submitted", "graded", "revision_requested"],
      default: "submitted",
    },
    marksObtained: {
      type: Number,
      default: null,
      min: 0,
    },
    feedback: {
      type: String,
      default: "",
    },
    gradedAt: {
      type: Date,
      default: null,
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

assignmentSubmissionSchema.index(
  { assignment: 1, student: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "AssignmentSubmission",
  assignmentSubmissionSchema
);