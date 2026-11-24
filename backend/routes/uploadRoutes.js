const express = require("express");
const { createVideoUploadUrl, createResourceUploadUrl } = require("../controllers/uploadController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/video", protect, authorizeRoles("instructor", "admin"), createVideoUploadUrl);
router.post("/resource", protect, authorizeRoles("instructor", "admin"), createResourceUploadUrl);

module.exports = router;