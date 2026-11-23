const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
    {
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true
        },

        question: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300
        },

        answer: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },

        order: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

faqSchema.index({ course: 1, order: 1 });

const FAQ = mongoose.model("FAQ", faqSchema);

module.exports = FAQ;
