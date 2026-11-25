const express = require("express");

const {
    createAssignment,
    getInstructorAssignments,
    toggleAssignmentPublish,
    getStudentAssignments,
    submitAssignment,
    getAssignmentSubmissions,
    getAssignmentFileUrl,
    gradeAssignmentSubmission
} = require("../controllers/assignmentController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// Instructor routes
router.post(
    "/",
    protect,
    authorizeRoles("instructor", "admin"),
    createAssignment
);

router.get(
    "/instructor",
    protect,
    authorizeRoles("instructor", "admin"),
    getInstructorAssignments
);

router.patch(
    "/:assignmentId/publish",
    protect,
    authorizeRoles("instructor", "admin"),
    toggleAssignmentPublish
);

// Student routes
router.get(
    "/course/:courseId",
    protect,
    authorizeRoles("student"),
    getStudentAssignments
);

router.post(
    "/:assignmentId/submit",
    protect,
    authorizeRoles("student"),
    submitAssignment
);

router.get(
    "/:assignmentId/submissions",
    protect,
    authorizeRoles("instructor", "admin"),
    getAssignmentSubmissions
);

router.get(
    "/submissions/:submissionId/file",
    protect,
    authorizeRoles("student", "instructor", "admin"),
    getAssignmentFileUrl
);

router.patch(
    "/submissions/:submissionId/grade",
    protect,
    authorizeRoles("instructor", "admin"),
    gradeAssignmentSubmission
);

module.exports = router;