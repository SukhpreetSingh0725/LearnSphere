const FAQ = require("../models/FAQ");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

// Check instructor/admin access
const checkCourseAccess = (course, user) => {
    if (!course) return false;

    if (user.role === "admin") return true;

    return course.instructor.toString() === user._id.toString();
};

// Create FAQ
const createFAQ = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { question, answer } = req.body;

        if (!question?.trim() || !answer?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Question and answer are required"
            });
        }

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        if (!checkCourseAccess(course, req.user)) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to manage FAQs"
            });
        }

        const lastFAQ = await FAQ.findOne({ course: courseId })
            .sort({ order: -1 });

        const faq = await FAQ.create({
            course: courseId,
            question: question.trim(),
            answer: answer.trim(),
            order: lastFAQ ? lastFAQ.order + 1 : 0
        });

        res.status(201).json({
            success: true,
            message: "FAQ created successfully",
            data: faq
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get FAQs for enrolled students
const getCourseFAQs = async (req, res) => {
    try {
        const { courseId } = req.params;

        const enrollment = await Enrollment.findOne({
            student: req.user._id,
            course: courseId,
            status: { $in: ["active", "completed"] }
        });

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: "You must be enrolled to view FAQs"
            });
        }

        const faqs = await FAQ.find({ course: courseId })
            .sort({ order: 1 });

        res.status(200).json({
            success: true,
            total: faqs.length,
            data: faqs
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get FAQs for instructor/admin management
const getManageCourseFAQs = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        if (!checkCourseAccess(course, req.user)) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to manage FAQs"
            });
        }

        const faqs = await FAQ.find({ course: courseId })
            .sort({ order: 1 });

        res.status(200).json({
            success: true,
            total: faqs.length,
            data: faqs
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update FAQ
const updateFAQ = async (req, res) => {
    try {
        const { faqId } = req.params;
        const { question, answer } = req.body;

        const faq = await FAQ.findById(faqId);

        if (!faq) {
            return res.status(404).json({
                success: false,
                message: "FAQ not found"
            });
        }

        const course = await Course.findById(faq.course);

        if (!checkCourseAccess(course, req.user)) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this FAQ"
            });
        }

        if (question !== undefined) {
            if (!question.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Question cannot be empty"
                });
            }

            faq.question = question.trim();
        }

        if (answer !== undefined) {
            if (!answer.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Answer cannot be empty"
                });
            }

            faq.answer = answer.trim();
        }

        await faq.save();

        res.status(200).json({
            success: true,
            message: "FAQ updated successfully",
            data: faq
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete FAQ
const deleteFAQ = async (req, res) => {
    try {
        const { faqId } = req.params;

        const faq = await FAQ.findById(faqId);

        if (!faq) {
            return res.status(404).json({
                success: false,
                message: "FAQ not found"
            });
        }

        const course = await Course.findById(faq.course);

        if (!checkCourseAccess(course, req.user)) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this FAQ"
            });
        }

        await faq.deleteOne();

        res.status(200).json({
            success: true,
            message: "FAQ deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createFAQ,
    getCourseFAQs,
    getManageCourseFAQs,
    updateFAQ,
    deleteFAQ
};
