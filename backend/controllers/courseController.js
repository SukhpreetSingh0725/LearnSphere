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

module.exports = {
    createCourse
};