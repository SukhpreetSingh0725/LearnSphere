
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");

// Get students enrolled in the instructor's courses
const getInstructorStudents = async (req, res) => {
  try {
    // Find courses owned by the logged-in instructor
    const courses = await Course.find({
      instructor: req.user._id,
    }).select("_id");

    const courseIds = courses.map((course) => course._id);

    // Find enrollments for those courses
    const enrollments = await Enrollment.find({
      course: { $in: courseIds },
      status: { $ne: "cancelled" },
    })
      .populate("student", "name email")
      .populate("course", "title")
      .sort({ enrolledAt: -1 });

    res.status(200).json({
      success: true,
      total: enrollments.length,
      data: enrollments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getInstructorStudents,
};
