const express = require("express");
const router = express.Router();

const {
    createFAQ,
    getCourseFAQs,
    getManageCourseFAQs,
    updateFAQ,
    deleteFAQ
} = require("../controllers/faqController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Instructor/Admin: Create FAQ
router.post(
    "/courses/:courseId/faqs",
    protect,
    authorizeRoles("instructor", "admin"),
    createFAQ
);

// Student: Get course FAQs
router.get(
    "/courses/:courseId/faqs",
    protect,
    authorizeRoles("student"),
    getCourseFAQs
);

router.get(
    "/courses/:courseId/manage-faqs",
    protect,
    authorizeRoles("instructor", "admin"),
    getManageCourseFAQs
);

// Instructor/Admin: Update FAQ
router.put(
    "/faqs/:faqId",
    protect,
    authorizeRoles("instructor", "admin"),
    updateFAQ
);

// Instructor/Admin: Delete FAQ
router.delete(
    "/faqs/:faqId",
    protect,
    authorizeRoles("instructor", "admin"),
    deleteFAQ
);

module.exports = router;
