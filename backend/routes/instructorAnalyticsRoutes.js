const express = require("express");

const {
  getInstructorAnalytics,
} = require("../controllers/instructorAnalyticsController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  authorizeRoles("instructor"),
  getInstructorAnalytics
);

module.exports = router;
