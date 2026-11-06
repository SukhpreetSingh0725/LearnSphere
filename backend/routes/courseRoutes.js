const express = require("express");

const { createCourse,
        getMyCourses,
        updateCourse,
        deleteCourse,
        submitCourse,
        getPendingCourses,
        approveCourse,
        rejectCourse,
        getPublishedCourses,
        getPublishedCourseById
} = require("../controllers/courseController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// Get instructor's courses
router.get(
    "/my-courses",
    protect,
    authorizeRoles("instructor", "admin"),
    getMyCourses
);

// Get pending courses (Admin only)
router.get(
    "/admin/pending",
    protect,
    authorizeRoles("admin"),
    getPendingCourses
);

// Get all published courses (Public)
router.get("/", getPublishedCourses);

// Get single published course (Public)
router.get("/:id", getPublishedCourseById);

// Approve course (Admin only)
router.patch(
    "/admin/:id/approve",
    protect,
    authorizeRoles("admin"),
    approveCourse
);

// Reject course (Admin only)
router.patch(
    "/admin/:id/reject",
    protect,
    authorizeRoles("admin"),
    rejectCourse
);


// Submit course for admin approval
router.patch(
    "/:id/submit",
    protect,
    authorizeRoles("instructor", "admin"),
    submitCourse
);

// Update course
router.put(
    "/:id",
    protect,
    authorizeRoles("instructor", "admin"),
    updateCourse
);

// Delete course
router.delete(
    "/:id",
    protect,
    authorizeRoles("instructor", "admin"),
    deleteCourse
);

// Create course
router.post(
    "/",
    protect,
    authorizeRoles("instructor", "admin"),
    createCourse
);



module.exports = router;