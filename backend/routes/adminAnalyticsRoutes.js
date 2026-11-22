const express = require("express");

const {
  getAdminAnalytics,
} = require("../controllers/adminAnalyticsController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  getAdminAnalytics
);

module.exports = router;
