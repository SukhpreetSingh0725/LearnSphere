const express = require("express");

const {
    createVideoUploadUrl,
    createResourceUploadUrl,
    createAssignmentUploadUrl,
    createProfileImageUploadUrl
} = require("../controllers/uploadController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
    "/video",
    protect,
    authorizeRoles("instructor", "admin"),
    createVideoUploadUrl
);

router.post(
    "/resource",
    protect,
    authorizeRoles("instructor", "admin"),
    createResourceUploadUrl
);

router.post(
    "/assignment",
    protect,
    authorizeRoles("student"),
    createAssignmentUploadUrl
);

router.post(
    "/profile-image",
    protect,
    authorizeRoles("instructor", "admin"),
    createProfileImageUploadUrl
);

module.exports = router;
