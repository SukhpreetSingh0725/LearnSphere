const Course = require("../models/Course");

// CREATE COURSE
const createCourse = async (req, res) => {
    try {
        const {
            title,
            category,
            level,
            price,
            description,
            thumbnail
        } = req.body;

        // Validate required fields
        if (!title || !category || !level || price === undefined || !description) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided"
            });
        }

        // Create course
        const course = await Course.create({
            title,
            instructor: req.user._id,
            category,
            level,
            price,
            description,
            thumbnail: thumbnail || "",
            status: "draft"
        });

        res.status(201).json({
            success: true,
            message: "Course created successfully",
            data: course
        });

    } catch (error) {
        console.error("Create course error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to create course"
        });
    }
};

// GET INSTRUCTOR'S COURSES
const getMyCourses = async (req, res) => {
    try {
        const courses = await Course.find({
            instructor: req.user._id
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            total: courses.length,
            data: courses
        });

    } catch (error) {
        console.error("Get courses error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch your courses"
        });
    }
};

// UPDATE COURSE
const updateCourse = async (req, res) => {
    try {
        const {
            title,
            category,
            level,
            price,
            description,
            thumbnail
        } = req.body;

        // Find course belonging to the logged-in instructor
        const course = await Course.findOne({
            _id: req.params.id,
            instructor: req.user._id
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found or you are not authorized to update it"
            });
        }

        // Update only the fields provided
        if (title !== undefined) course.title = title;
        if (category !== undefined) course.category = category;
        if (level !== undefined) course.level = level;
        if (price !== undefined) course.price = price;
        if (description !== undefined) course.description = description;
        if (thumbnail !== undefined) course.thumbnail = thumbnail;

        await course.save();

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            data: course
        });

    } catch (error) {
        console.error("Update course error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to update course"
        });
    }
};

// DELETE COURSE
const deleteCourse = async (req, res) => {
    try {
        // Find course belonging to logged-in instructor
        const course = await Course.findOne({
            _id: req.params.id,
            instructor: req.user._id
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found or you are not authorized"
            });
        }

        // Allow deletion only for draft or rejected courses
        if (!["draft", "rejected"].includes(course.status)) {
            return res.status(400).json({
                success: false,
                message: "Only draft or rejected courses can be deleted"
            });
        }

        await course.deleteOne();

        res.status(200).json({
            success: true,
            message: "Course deleted successfully"
        });

    } catch (error) {
        console.error("Delete course error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to delete course"
        });
    }
};

// SUBMIT COURSE FOR APPROVAL
const submitCourse = async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.id,
            instructor: req.user._id
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        // Only draft or rejected courses can be submitted
        if (!["draft", "rejected"].includes(course.status)) {
            return res.status(400).json({
                success: false,
                message: "Course cannot be submitted in its current status"
            });
        }

        course.status = "pending";

        await course.save();

        res.status(200).json({
            success: true,
            message: "Course submitted for admin approval",
            data: course
        });

    } catch (error) {
        console.error("Submit course error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to submit course"
        });
    }
};

// GET PENDING COURSES (ADMIN)
const getPendingCourses = async (req, res) => {
    try {
        const courses = await Course.find({
            status: "pending"
        })
        .populate("instructor", "name email")
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            total: courses.length,
            data: courses
        });

    } catch (error) {
        console.error("Get pending courses error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch pending courses"
        });
    }
};

// APPROVE COURSE (ADMIN)
const approveCourse = async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.id,
            status: "pending"
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Pending course not found"
            });
        }

        course.status = "published";

        await course.save();

        res.status(200).json({
            success: true,
            message: "Course approved successfully",
            data: course
        });

    } catch (error) {
        console.error("Approve course error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to approve course"
        });
    }
};

// REJECT COURSE (ADMIN)
const rejectCourse = async (req, res) => {
    try {
        const { rejectionReason } = req.body;

        if (
            typeof rejectionReason !== "string" ||
            !rejectionReason.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Rejection reason is required"
            });
        }

        const course = await Course.findOne({
            _id: req.params.id,
            status: "pending"
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Pending course not found"
            });
        }

        course.status = "rejected";
        course.rejectionReason = rejectionReason.trim();

        await course.save();

        res.status(200).json({
            success: true,
            message: "Course rejected successfully",
            data: course
        });

    } catch (error) {
        console.error("Reject course error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to reject course"
        });
    }
};

module.exports = {
    createCourse,
    getMyCourses,
    updateCourse,
    deleteCourse,
    submitCourse,
    getPendingCourses,
    approveCourse,
    rejectCourse
};