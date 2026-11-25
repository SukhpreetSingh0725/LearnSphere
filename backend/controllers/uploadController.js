const crypto = require("crypto");

const { supabase, BUCKET } = require("../config/storage");
const Lesson = require("../models/Lesson");
const Section = require("../models/Section");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

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


// POST /api/uploads/assignment
const createAssignmentUploadUrl = async (req, res) => {
    try {
        const { assignmentId, contentType, fileSize } = req.body;

        const ALLOWED_ASSIGNMENT_TYPES = {
            "application/pdf": "pdf",
            "application/msword": "doc",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
            "application/zip": "zip",
            "application/x-zip-compressed": "zip"
        };

        const ext = ALLOWED_ASSIGNMENT_TYPES[contentType];

        if (!assignmentId || !ext) {
            return res.status(400).json({
                success: false,
                message: "A valid assignmentId and file type are required"
            });
        }

        const Assignment = require("../models/Assignment");

        const assignment = await Assignment.findOne({
            _id: assignmentId,
            isPublished: true
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found or not published"
            });
        }
        if (
            !Number.isFinite(fileSize) ||
            fileSize <= 0 ||
            fileSize > assignment.maxFileSizeMB * 1024 * 1024
        ) {
            return res.status(400).json({
                success: false,
                message: `File size must not exceed ${assignment.maxFileSizeMB} MB`
            });
        }

        const extension = ALLOWED_ASSIGNMENT_TYPES[contentType];

            if (!assignment.allowedFileTypes.includes(extension)) {
                return res.status(400).json({
                    success: false,
                    message: "This file type is not allowed for this assignment"
                });
            }

        const enrollment = await Enrollment.findOne({
            student: req.user._id,
            course: assignment.course,
            status: { $in: ["active", "completed"] }
        });

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: "You must be enrolled in this course to upload a submission"
            });
        }

        const key = `${assignment.course}/${assignment._id}/${req.user._id}/${crypto.randomUUID()}.${ext}`;

        const { data, error } = await supabase.storage
            .from("assignments")
            .createSignedUploadUrl(key);

        if (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                key,
                token: data.token
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createVideoUploadUrl,
    createResourceUploadUrl,
    createAssignmentUploadUrl
};