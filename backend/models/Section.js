
const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    order: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

sectionSchema.index({ course: 1, order: 1 });

const Section = mongoose.model("Section", sectionSchema);

module.exports = Section;
