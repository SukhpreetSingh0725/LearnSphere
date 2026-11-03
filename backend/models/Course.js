const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },

    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    category: {
        type: String,
        required: true,
        trim: true
    },

    level: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced"],
        required: true
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },

    description: {
        type: String,
        required: true,
        maxlength: 2000
    },

    thumbnail: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        enum: ["draft", "pending", "published", "rejected"],
        default: "draft"
    }

}, {
    timestamps: true
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;