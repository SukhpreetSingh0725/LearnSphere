const express = require("express");

const {
  createQuiz,
  getInstructorQuizzes,
  getInstructorQuizAttempts,
  getStudentQuizzes,
  getStudentQuizById,
  submitQuiz,
  toggleQuizPublish,
  updateQuiz,
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

router.get(
  "/:quizId/attempts",
  protect,
  authorizeRoles("instructor"),
  getInstructorQuizAttempts
);

router.patch(
    "/:quizId/publish",
    protect,
    authorizeRoles("instructor"),
    toggleQuizPublish
  );

  router.patch(
    "/:quizId",
    protect,
    authorizeRoles("instructor"),
    updateQuiz
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

router.get(
  "/:quizId",
  protect,
  authorizeRoles("student"),
  getStudentQuizById
);

module.exports = router;