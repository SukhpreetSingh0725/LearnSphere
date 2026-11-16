const express = require("express");

const {
  getAllUsers,
  updateUserStatus,
} = require("../controllers/adminUserController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// Get all users (Admin only)
router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  getAllUsers
);

// Activate or deactivate user (Admin only)
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin"),
  updateUserStatus
);

module.exports = router;
