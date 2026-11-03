const express = require("express");

const { createCourse } = require("../controllers/courseController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// Create course (Instructor/Admin only)
router.post(
    "/",
    protect,
    authorizeRoles("instructor", "admin"),
    createCourse
);

module.exports = router;