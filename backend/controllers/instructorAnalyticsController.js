
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

const getInstructorAnalytics = async (req, res) => {
  try {
    const instructorId = req.user._id;

    const courses = await Course.find({ instructor: instructorId })
      .select("_id title status");

    const courseIds = courses.map((course) => course._id);

    const [
      totalCourses,
      publishedCourses,
      pendingCourses,
      rejectedCourses,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      uniqueStudents,
    ] = await Promise.all([
      Course.countDocuments({ instructor: instructorId }),
      Course.countDocuments({ instructor: instructorId, status: "published" }),
      Course.countDocuments({ instructor: instructorId, status: "pending" }),
      Course.countDocuments({ instructor: instructorId, status: "rejected" }),
      Enrollment.countDocuments({ course: { $in: courseIds } }),
      Enrollment.countDocuments({
        course: { $in: courseIds },
        status: "active",
      }),
      Enrollment.countDocuments({
        course: { $in: courseIds },
        status: "completed",
      }),
      Enrollment.distinct("student", {
        course: { $in: courseIds },
        status: { $in: ["active", "completed"] },
      }),
    ]);

    const coursePerformance = await Enrollment.aggregate([
      {
        $match: {
          course: { $in: courseIds },
          status: { $in: ["active", "completed"] },
        },
      },
      {
        $group: {
          _id: "$course",
          totalStudents: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      {
        $project: {
          _id: 0,
          courseId: "$course._id",
          title: "$course.title",
          status: "$course.status",
          totalStudents: 1,
        },
      },
      { $sort: { totalStudents: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCourses,
        publishedCourses,
        pendingCourses,
        rejectedCourses,
        totalStudents: uniqueStudents.length,
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        coursePerformance,
      },
    });
  } catch (error) {
    console.error("Instructor analytics error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch instructor analytics",
    });
  }
};

module.exports = { getInstructorAnalytics };
