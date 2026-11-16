const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");

// Get students enrolled in the instructor's courses
const getInstructorStudents = async (req, res) => {
  try {
    const courses = await Course.find({
      instructor: req.user._id,
    }).select("_id");

    const courseIds = courses.map((course) => course._id);

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

// Get courses enrolled by the logged-in student
const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      student: req.user._id,
      status: { $ne: "cancelled" },
    })
      .populate({
        path: "course",
        select: "title description thumbnail price level category instructor",
        populate: {
          path: "instructor",
          select: "name",
        },
      })
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



const createFreeEnrollment = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (course.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "This course is not available for enrollment",
      });
    }

    if (Number(course.price) !== 0) {
      return res.status(400).json({
        success: false,
        message: "This course requires payment",
      });
    }

    let enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (enrollment && enrollment.status !== "cancelled") {
      return res.status(409).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    if (enrollment) {
      enrollment.status = "active";
      enrollment.enrolledAt = new Date();
      await enrollment.save();
    } else {
      enrollment = await Enrollment.create({
        student: req.user._id,
        course: courseId,
      });
    }

    res.status(201).json({
      success: true,
      message: "Successfully enrolled in the course",
      data: enrollment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  getInstructorStudents,
  getMyEnrollments,
  createFreeEnrollment,
};
