const express = require("express");
const { getInstructorStudents } = require("../controllers/enrollmentController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// Get students enrolled in instructor's courses
router.get(
  "/instructor/students",
  protect,
  authorizeRoles("instructor"),
  getInstructorStudents
);

module.exports = router;
