const express = require("express");
const {
    getLessonStreamUrl,
    getLessonResourceUrl
} = require("../controllers/streamController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Any logged-in user; access is decided inside the controller.
router.get("/:lessonId/stream-url", protect, getLessonStreamUrl);
router.get("/:lessonId/resource-url", protect, getLessonResourceUrl);

module.exports = router;