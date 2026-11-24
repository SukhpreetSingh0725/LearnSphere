const crypto = require("crypto");

const { supabase, BUCKET } = require("../config/storage");
const Lesson = require("../models/Lesson");
const Section = require("../models/Section");
const Course = require("../models/Course");

const ALLOWED_TYPES = {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov"
};

// POST /api/uploads/video
// Returns a signed upload token so the browser uploads straight to storage.
const createVideoUploadUrl = async (req, res) => {
    const { lessonId, contentType } = req.body;

    const ext = ALLOWED_TYPES[contentType];
    if (!lessonId || !ext) {
        return res.status(400).json({
            success: false,
            message: "lessonId and a valid video contentType (mp4, webm, mov) are required"
        });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        return res.status(404).json({ success: false, message: "Lesson not found" });
    }

    const section = await Section.findById(lesson.section);
    const course = section && await Course.findById(section.course);

    const isOwner = course && course.instructor.toString() === req.user._id.toString();
    if (!course || (!isOwner && req.user.role !== "admin")) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to upload to this lesson"
        });
    }

    const key = `${course._id}/${lesson._id}/${crypto.randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUploadUrl(key);

    if (error) {
        return res.status(500).json({ success: false, message: error.message });
    }

    res.status(200).json({
        success: true,
        data: { key, token: data.token }
    });
};

// Allowed lesson resource file types
const ALLOWED_RESOURCE_TYPES = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx"
};

// POST /api/uploads/resource
const createResourceUploadUrl = async (req, res) => {
    const { lessonId, contentType } = req.body;

    const ext = ALLOWED_RESOURCE_TYPES[contentType];

    if (!lessonId || !ext) {
        return res.status(400).json({
            success: false,
            message: "A valid lessonId and resource file type are required"
        });
    }

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
        return res.status(404).json({
            success: false,
            message: "Lesson not found"
        });
    }

    const section = await Section.findById(lesson.section);
    const course = section && await Course.findById(section.course);

    const isOwner =
        course &&
        course.instructor.toString() === req.user._id.toString();

    if (!course || (!isOwner && req.user.role !== "admin")) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to upload to this lesson"
        });
    }

    const key = `${course._id}/${lesson._id}/${crypto.randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage
        .from("resources")
        .createSignedUploadUrl(key);

    if (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }

    res.status(200).json({
        success: true,
        data: {
            key,
            token: data.token
        }
    });
};

module.exports = {
    createVideoUploadUrl,
    createResourceUploadUrl
};