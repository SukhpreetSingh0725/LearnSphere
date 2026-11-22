const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

const getAdminAnalytics = async (req, res) => {
  try {
    const [
      totalStudents,
      totalInstructors,
      totalCourses,
      publishedCourses,
      pendingCourses,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      cancelledEnrollments,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "instructor" }),
      Course.countDocuments(),
      Course.countDocuments({ status: "published" }),
      Course.countDocuments({ status: "pending" }),
      Enrollment.countDocuments(),
      Enrollment.countDocuments({ status: "active" }),
      Enrollment.countDocuments({ status: "completed" }),
      Enrollment.countDocuments({ status: "cancelled" }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: {
          totalStudents,
          totalInstructors,
        },
        courses: {
          totalCourses,
          publishedCourses,
          pendingCourses,
        },
        enrollments: {
          totalEnrollments,
          activeEnrollments,
          completedEnrollments,
          cancelledEnrollments,
        },
      },
    });
  } catch (error) {
    console.error("Admin analytics error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch admin analytics",
    });
  }
};

module.exports = { getAdminAnalytics };
