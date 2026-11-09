
const express = require("express");

const {
    createSection,
    getCourseCurriculum,
    updateSection,
    deleteSection,
    createLesson,
    getSectionLessons,
    updateLesson,
    deleteLesson
} = require("../controllers/curriculumController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// Create section
router.post(
    "/courses/:courseId/sections",
    protect,
    authorizeRoles("instructor", "admin"),
    createSection
);

// Get course curriculum
router.get(
    "/courses/:courseId/sections",
    protect,
    authorizeRoles("instructor", "admin"),
    getCourseCurriculum
);

// Update section
router.put(
    "/sections/:sectionId",
    protect,
    authorizeRoles("instructor", "admin"),
    updateSection
);

// Delete section
router.delete(
    "/sections/:sectionId",
    protect,
    authorizeRoles("instructor", "admin"),
    deleteSection
);

// Create Lesson
router.post(
    "/sections/:sectionId/lessons",
    protect,
    authorizeRoles("instructor", "admin"),
    createLesson
);

// Get Section Lessons
router.get(
    "/sections/:sectionId/lessons",
    protect,
    authorizeRoles("instructor", "admin"),
    getSectionLessons
);

// Update Lesson
router.put(
    "/lessons/:lessonId",
    protect,
    authorizeRoles("instructor", "admin"),
    updateLesson
);

// Delete Lesson
router.delete(
    "/lessons/:lessonId",
    protect,
    authorizeRoles("instructor", "admin"),
    deleteLesson
);

module.exports = router;
