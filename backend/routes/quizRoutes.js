const express = require("express");

const {
  createQuiz,
  getInstructorQuizzes,
  getStudentQuizzes,
  submitQuiz,
  toggleQuizPublish,
} = require("../controllers/quizController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// Instructor routes
router.post(
  "/courses/:courseId",
  protect,
  authorizeRoles("instructor"),
  createQuiz
);

router.get(
  "/instructor",
  protect,
  authorizeRoles("instructor"),
  getInstructorQuizzes
);

router.patch(
    "/:quizId/publish",
    protect,
    authorizeRoles("instructor"),
    toggleQuizPublish
  );

// Student routes
router.get(
  "/courses/:courseId",
  protect,
  authorizeRoles("student"),
  getStudentQuizzes
);

router.post(
  "/:quizId/submit",
  protect,
  authorizeRoles("student"),
  submitQuiz
);

module.exports = router;