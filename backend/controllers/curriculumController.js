const Course = require("../models/Course");
const Section = require("../models/Section");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");

// Check whether the user can manage this course
const checkCourseAccess = (course, user) => {
    if (!course) return false;

    if (user.role === "admin") return true;

    return course.instructor.toString() === user._id.toString();
};

// Create Section
const createSection = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Section title is required"
            });
        }

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        if (!checkCourseAccess(course, req.user)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to manage this course"
            });
        }

        const lastSection = await Section.findOne({ course: courseId })
            .sort({ order: -1 });

        const order = lastSection ? lastSection.order + 1 : 0;

        const section = await Section.create({
            course: courseId,
            title: title.trim(),
            order
        });

        res.status(201).json({
            success: true,
            message: "Section created successfully",
            data: section
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Course Curriculum
const getCourseCurriculum = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId)

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        if (!checkCourseAccess(course, req.user)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this curriculum"
            });
        }

        const sections = await Section.find({ course: courseId })
            .sort({ order: 1 })
            .lean();

        const sectionIds = sections.map(section => section._id);

        const lessons = await Lesson.find({
            section: { $in: sectionIds }
        })
            .sort({ order: 1 })
            .lean();

        const curriculum = sections.map(section => ({
            ...section,
            lessons: lessons.filter(
                lesson => lesson.section.toString() === section._id.toString()
            )
        }));

        res.status(200).json({
            success: true,
            totalSections: sections.length,
            data: curriculum
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Section
const updateSection = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { title } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Section title is required"
            });
        }

        const section = await Section.findById(sectionId);

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found"
            });
        }

        const course = await Course.findById(section.course);

        if (!checkCourseAccess(course, req.user)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this section"
            });
        }

        section.title = title.trim();
        await section.save();

        res.status(200).json({
            success: true,
            message: "Section updated successfully",
            data: section
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete Section and its Lessons
const deleteSection = async (req, res) => {
    try {
        const { sectionId } = req.params;

        const section = await Section.findById(sectionId);

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found"
            });
        }

        const course = await Course.findById(section.course);

        if (!checkCourseAccess(course, req.user)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this section"
            });
        }

        await Lesson.deleteMany({ section: sectionId });
        await section.deleteOne();

        res.status(200).json({
            success: true,
            message: "Section and its lessons deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Create Lesson
const createLesson = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { title, type, durationSec, isPreview, videoKey,subtitleUrl,transcript } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Lesson title is required"
            });
        }

        const section = await Section.findById(sectionId);

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found"
            });
        }

        const course = await Course.findById(section.course);

        if (!checkCourseAccess(course, req.user)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to manage this lesson"
            });
        }

        const lastLesson = await Lesson.findOne({ section: sectionId })
            .sort({ order: -1 });

        const order = lastLesson ? lastLesson.order + 1 : 0;

        const lesson = await Lesson.create({
            section: sectionId,
            title: title.trim(),
            type,
            durationSec,
            isPreview,
            videoKey,
            subtitleUrl,
            transcript,
            order
        });

        res.status(201).json({
            success: true,
            message: "Lesson created successfully",
            data: lesson
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Get Lessons
const getSectionLessons = async (req, res) => {
    try {
        const { sectionId } = req.params;

        const section = await Section.findById(sectionId);

        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found"
            });
        }

        const course = await Course.findById(section.course);

        if (!checkCourseAccess(course, req.user)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view these lessons"
            });
        }

        const lessons = await Lesson.find({ section: sectionId })
            .sort({ order: 1 });

        res.status(200).json({
            success: true,
            total: lessons.length,
            data: lessons
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Update Lesson
const updateLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { title, type, durationSec, isPreview, videoKey,subtitleUrl,
            transcript } = req.body;

        const lesson = await Lesson.findById(lessonId);

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        const section = await Section.findById(lesson.section);
        const course = section
            ? await Course.findById(section.course)
            : null;

        if (!checkCourseAccess(course, req.user)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this lesson"
            });
        }

        if (title !== undefined) lesson.title = title.trim();
        if (type !== undefined) lesson.type = type;
        if (durationSec !== undefined) lesson.durationSec = durationSec;
        if (isPreview !== undefined) lesson.isPreview = isPreview;
        if (videoKey !== undefined) lesson.videoKey = videoKey;
        if (subtitleUrl !== undefined) lesson.subtitleUrl = subtitleUrl;
        if (transcript !== undefined) lesson.transcript = transcript;

        await lesson.save();

        res.status(200).json({
            success: true,
            message: "Lesson updated successfully",
            data: lesson
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Delete Lesson
const deleteLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;

        const lesson = await Lesson.findById(lessonId);

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        const section = await Section.findById(lesson.section);
        const course = section
            ? await Course.findById(section.course)
            : null;

        if (!checkCourseAccess(course, req.user)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this lesson"
            });
        }

        await lesson.deleteOne();

        res.status(200).json({
            success: true,
            message: "Lesson deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Course Curriculum for Enrolled Students
const getStudentCourseCurriculum = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId)
        .populate("instructor", "name profileImage bio");

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const enrollment = await Enrollment.findOne({
            student: req.user._id,
            course: courseId,
            status: { $in: ["active", "completed"] }
        });

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: "You must be enrolled to access this course"
            });
        }

        const sections = await Section.find({ course: courseId })
            .sort({ order: 1 })
            .lean();

        const sectionIds = sections.map(section => section._id);

        const lessons = await Lesson.find({
            section: { $in: sectionIds }
        })
            .sort({ order: 1 })
            .lean();

        const curriculum = sections.map(section => ({
            ...section,
            lessons: lessons.filter(
                lesson =>
                    lesson.section.toString() === section._id.toString()
            )
        }));

        res.status(200).json({
            success: true,
            data: {
                course: {
                    id: course._id,
                    title: course.title,
                    description: course.description,
                    thumbnail: course.thumbnail,
                    instructor: course.instructor
                        ? {
                            id: course.instructor._id,
                            name: course.instructor.name,
                            profileImage: course.instructor.profileImage,
                            bio: course.instructor.bio
                        }
                        : null
                },
                totalSections: sections.length,
                data: curriculum
            }
        });

    } catch (error) {
        console.error("Student curriculum error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to load course curriculum"
        });
    }
};

module.exports = {
    createSection,
    getCourseCurriculum,
    updateSection,
    deleteSection,
    createLesson,
    getSectionLessons,
    updateLesson,
    deleteLesson,
    getStudentCourseCurriculum
};
