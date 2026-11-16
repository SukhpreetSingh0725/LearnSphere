
const User = require("../models/User");
const Course = require("../models/Course");

// Get Admin Dashboard Statistics
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalCourses,
      pendingCourses,
      publishedCourses,
      rejectedCourses,
      totalStudents,
      totalInstructors,
    ] = await Promise.all([
      Course.countDocuments(),
      Course.countDocuments({ status: "pending" }),
      Course.countDocuments({ status: "published" }),
      Course.countDocuments({ status: "rejected" }),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "instructor" }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCourses,
        pendingCourses,
        publishedCourses,
        rejectedCourses,
        totalStudents,
        totalInstructors,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
};
