
const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    type: {
      type: String,
      enum: ["video", "quiz", "assignment"],
      default: "video"
    },

    videoKey: {
      type: String,
      default: ""
    },

    durationSec: {
      type: Number,
      default: 0,
      min: 0
    },

    order: {
      type: Number,
      required: true,
      min: 0
    },

    isPreview: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

lessonSchema.index({ section: 1, order: 1 });

const Lesson = mongoose.model("Lesson", lessonSchema);

module.exports = Lesson;
