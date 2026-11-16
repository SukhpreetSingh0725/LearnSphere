const express = require("express");
const {
  getInstructorStudents,
  getMyEnrollments,
  createFreeEnrollment,
} = require("../controllers/enrollmentController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// Instructor: View enrolled students
router.get(
  "/instructor/students",
  protect,
  authorizeRoles("instructor"),
  getInstructorStudents
);

// Student: View enrolled courses
router.get(
  "/my-courses",
  protect,
  authorizeRoles("student"),
  getMyEnrollments
);

// Student: Enroll in a free course
router.post(
  "/:courseId",
  protect,
  authorizeRoles("student"),
  createFreeEnrollment
);

module.exports = router;
