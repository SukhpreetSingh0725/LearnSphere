const express = require("express");
const router = express.Router();

const {
  getCourseProgress,
  updateLessonProgress
} = require("../controllers/progressController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Get Course Progress
router.get(
  "/:courseId",
  protect,
  authorizeRoles("student"),
  getCourseProgress
);

// Update Lesson Progress
router.patch(
  "/:courseId/lessons/:lessonId",
  protect,
  authorizeRoles("student"),
  updateLessonProgress
);

module.exports = router;
