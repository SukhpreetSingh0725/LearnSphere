const mongoose = require("mongoose");

const { supabase, BUCKET } = require("../config/storage");
const Lesson = require("../models/Lesson");
const Section = require("../models/Section");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

const STREAM_URL_TTL_SEC = 5 * 60;

// GET /api/lessons/:lessonId/stream-url
// Returns a short-lived signed URL, only after verifying access.
const getLessonStreamUrl = async (req, res) => {
    const { lessonId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        return res.status(400).json({ success: false, message: "Invalid lesson ID" });
    }

    const lesson = await Lesson.findById(lessonId).lean();
    if (!lesson || !lesson.videoKey) {
        return res.status(404).json({ success: false, message: "Video not found" });
    }

    const section = await Section.findById(lesson.section).lean();
    const course = section && await Course.findById(section.course).lean();
    if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
    }

    const user = req.user;
    const isOwner = course.instructor.toString() === user._id.toString();
    const isAdmin = user.role === "admin";

    let allowed = isOwner || isAdmin;

    // Free preview lessons are open, but only for published courses.
    if (!allowed && lesson.isPreview && course.status === "published") {
        allowed = true;
    }

    if (!allowed) {
        const enrollment = await Enrollment.exists({
            student: user._id,
            course: course._id,
            status: { $in: ["active", "completed"] }
        });
        allowed = Boolean(enrollment);
    }

    if (!allowed) {
        return res.status(403).json({
            success: false,
            message: "You must be enrolled to watch this lesson"
        });
    }

    const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(lesson.videoKey, STREAM_URL_TTL_SEC);

    if (error) {
        return res.status(404).json({ success: false, message: "Video file not found" });
    }

    res.set("Cache-Control", "no-store");
    res.status(200).json({
        success: true,
        data: { url: data.signedUrl, expiresInSec: STREAM_URL_TTL_SEC }
    });
};

// GET /api/lessons/:lessonId/resource-url
const getLessonResourceUrl = async (req, res) => {
    const { lessonId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid lesson ID"
        });
    }

    const lesson = await Lesson.findById(lessonId).lean();

    if (!lesson) {
        return res.status(404).json({
            success: false,
            message: "Lesson not found"
        });
    }

    const section = await Section.findById(lesson.section).lean();
    const course = section && await Course.findById(section.course).lean();

    if (!course) {
        return res.status(404).json({
            success: false,
            message: "Course not found"
        });
    }

    const user = req.user;

    const isOwner =
        course.instructor.toString() === user._id.toString();

    const isAdmin = user.role === "admin";

    let allowed = isOwner || isAdmin;

    if (!allowed) {
        const enrollment = await Enrollment.exists({
            student: user._id,
            course: course._id,
            status: { $in: ["active", "completed"] }
        });

        allowed = Boolean(enrollment);
    }

    if (!allowed) {
        return res.status(403).json({
            success: false,
            message: "You must be enrolled to access this resource"
        });
    }

    const { key } = req.query;

    const resourceExists = lesson.resources?.some(
        (resource) => resource.url === key
    );

    if (!key || !resourceExists) {
        return res.status(404).json({
            success: false,
            message: "Resource not found"
        });
    }

    const { data, error } = await supabase.storage
        .from("resources")
        .createSignedUrl(key, 5 * 60);

    if (error) {
        return res.status(404).json({
            success: false,
            message: "Resource file not found"
        });
    }

    res.set("Cache-Control", "no-store");

    return res.status(200).json({
        success: true,
        data: {
            url: data.signedUrl,
            expiresInSec: 300
        }
    });
};

module.exports = {
    getLessonStreamUrl,
    getLessonResourceUrl
};