
const mongoose = require("mongoose");

const Progress = require("../models/Progress");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Section = require("../models/Section");
const Lesson = require("../models/Lesson");

// Get Student Course Progress
const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID"
      });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
      status: { $in: ["active", "completed"] }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this course"
      });
    }

    const sections = await Section.find({ course: courseId }).select("_id");
    const sectionIds = sections.map(section => section._id);

    const totalLessons = await Lesson.countDocuments({
      section: { $in: sectionIds }
    });

    const progress = await Progress.findOne({
      student: req.user._id,
      course: courseId
    })
      .populate("lastLesson", "title type")
      .lean();

    const completedLessons = progress?.completedLessons || [];
    const completedCount = completedLessons.length;

    const percentage = totalLessons === 0
      ? 0
      : Math.round((completedCount / totalLessons) * 100);

    res.status(200).json({
      success: true,
      data: {
        totalLessons,
        completedLessons: completedCount,
        completedLessonIds: completedLessons.map(
          lessonId => lessonId.toString()
        ),
        percentage,
        lastLesson: progress?.lastLesson || null,
        lastPosition: progress?.lastPosition || 0,
        completedAt: progress?.completedAt || null
      }
    });

  } catch (error) {
    console.error("Get progress error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to load course progress"
    });
  }
};


// Update Student Lesson Progress
const updateLessonProgress = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { completed, lastPosition } = req.body;
    if (
      lastPosition !== undefined &&
      (
        typeof lastPosition !== "number" ||
        !Number.isFinite(lastPosition) ||
        lastPosition < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Last position must be a valid non-negative number"
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(lessonId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid course or lesson ID"
      });
    }

    if (
      completed !== undefined &&
      typeof completed !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "Completed must be true or false"
      });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
      status: { $in: ["active", "completed"] }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this course"
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    const sections = await Section.find({ course: courseId }).select("_id");
    const sectionIds = sections.map(section => section._id);

    const lesson = await Lesson.findOne({
      _id: lessonId,
      section: { $in: sectionIds }
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found in this course"
      });
    }

    if (lesson.type === "quiz" && completed !== undefined) {
      return res.status(403).json({
        success: false,
        message: "Quiz lessons can only be completed by passing the quiz"
      });
    }

    const update = {
      $set: {
        lastLesson: lessonId
      }
    };

    if (lastPosition !== undefined) {
      update.$set.lastPosition = lastPosition;
    }

    if (completed === true) {
      update.$addToSet = {
        completedLessons: lessonId
      };
    } else if (completed === false) {
      update.$pull = {
        completedLessons: lessonId
      };
    }

    const progress = await Progress.findOneAndUpdate(
      {
        student: req.user._id,
        course: courseId
      },
      update,
      {
        returnDocument: "after",
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    const totalLessons = await Lesson.countDocuments({
      section: { $in: sectionIds }
    });

    const completedCount = progress.completedLessons.length;

    const allCompleted =
      totalLessons > 0 && completedCount === totalLessons;

    progress.completedAt = allCompleted ? new Date() : null;
    await progress.save();

    const percentage = totalLessons === 0
      ? 0
      : Math.round((completedCount / totalLessons) * 100);

    res.status(200).json({
      success: true,
      message:
        completed === true
          ? "Lesson marked as completed"
          : completed === false
          ? "Lesson completion removed"
          : "Last watched lesson updated",
      data: {
        totalLessons,
        completedLessons: completedCount,
        completedLessonIds: progress.completedLessons.map(
          lessonId => lessonId.toString()
        ),
        percentage,
        lastLesson: progress.lastLesson,
        lastPosition: progress.lastPosition || 0,
        completedAt: progress.completedAt
      }
    });

  } catch (error) {
    console.error("Update progress error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to update lesson progress"
    });
  }
};

module.exports = {
  getCourseProgress,
  updateLessonProgress
};
