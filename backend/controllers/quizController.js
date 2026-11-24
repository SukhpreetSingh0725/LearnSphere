const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Lesson = require("../models/Lesson");
const Section = require("../models/Section");

// Create Quiz (Instructor)
const createQuiz = async (req, res) => {
  try {
    const { courseId } = req.params;
    const {
      title,
      description,
      questions,
      passingScore,
      maxAttempts,
      lessonId,
    } = req.body;

    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Quiz title and questions are required",
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only create quizzes for your own courses",
      });
    }
    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: "Please select a quiz lesson",
      });
    }
    
    const lesson = await Lesson.findById(lessonId);
    
    if (!lesson || lesson.type !== "quiz") {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz lesson",
      });
    }
    
    const section = await Section.findById(lesson.section);
    
    if (!section || section.course.toString() !== courseId) {
      return res.status(400).json({
        success: false,
        message: "The selected lesson does not belong to this course",
      });
    }
    
    const existingQuiz = await Quiz.findOne({ lesson: lessonId });
    
    if (existingQuiz) {
      return res.status(409).json({
        success: false,
        message: "A quiz is already attached to this lesson",
      });
    }

    for (const question of questions) {
      if (
        !question.question ||
        !Array.isArray(question.options) ||
        question.options.length < 2 ||
        !Number.isInteger(question.correctAnswer) ||
        question.correctAnswer < 0 ||
        question.correctAnswer >= question.options.length
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide valid questions, options and correct answers",
        });
      }
    }

    const quiz = await Quiz.create({
      course: courseId,
      lesson: lessonId,
      instructor: req.user._id,
      title,
      description,
      questions,
      passingScore,
      maxAttempts,
    });

    res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      data: quiz,
    });
  } catch (error) {
    console.error("Create quiz error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to create quiz",
    });
  }
};

// Get Instructor Quizzes
const getInstructorQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({
      instructor: req.user._id,
    }).populate("course", "title");

    res.json({
      success: true,
      data: quizzes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch quizzes",
    });
  }
};

// Publish or Unpublish Quiz
const toggleQuizPublish = async (req, res) => {
    try {
      const quiz = await Quiz.findOne({
        _id: req.params.quizId,
        instructor: req.user._id,
      });
  
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: "Quiz not found",
        });
      }
  
      quiz.isPublished = !quiz.isPublished;
      await quiz.save();
  
      res.json({
        success: true,
        message: quiz.isPublished
          ? "Quiz published successfully"
          : "Quiz unpublished successfully",
        data: quiz,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Unable to update quiz",
      });
    }
  };

// Get Student Quizzes
const getStudentQuizzes = async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
      status: { $in: ["active", "completed"] },
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    const quizzes = await Quiz.find({
      course: courseId,
      isPublished: true,
    }).select("-questions.correctAnswer");

    res.json({
      success: true,
      data: quizzes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch quizzes",
    });
  }
};

// Submit Quiz
const submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "Answers must be an array",
      });
    }

    const quiz = await Quiz.findById(quizId);

    if (!quiz || !quiz.isPublished) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found or not published",
      });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: quiz.course,
      status: { $in: ["active", "completed"] },
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    const previousAttempts = await QuizAttempt.countDocuments({
      quiz: quizId,
      student: req.user._id,
    });

    if (previousAttempts >= quiz.maxAttempts) {
      return res.status(403).json({
        success: false,
        message: "Maximum quiz attempts reached",
      });
    }

    let correctCount = 0;
    const savedAnswers = [];

    for (const answer of answers) {
      const question = quiz.questions.id(answer.questionId);

      if (
        !question ||
        !Number.isInteger(answer.selectedAnswer) ||
        answer.selectedAnswer < 0 ||
        answer.selectedAnswer >= question.options.length
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid quiz answer",
        });
      }

      if (question.correctAnswer === answer.selectedAnswer) {
        correctCount++;
      }

      savedAnswers.push({
        questionId: question._id,
        selectedAnswer: answer.selectedAnswer,
      });
    }

    const totalQuestions = quiz.questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= quiz.passingScore;

    const attempt = await QuizAttempt.create({
      quiz: quizId,
      student: req.user._id,
      answers: savedAnswers,
      score,
      totalQuestions,
      passed,
      attemptNumber: previousAttempts + 1,
    });

    res.status(201).json({
      success: true,
      message: "Quiz submitted successfully",
      data: {
        score,
        correctCount,
        totalQuestions,
        passed,
        attemptNumber: attempt.attemptNumber,
        remainingAttempts: Math.max(
          0,
          quiz.maxAttempts - attempt.attemptNumber
        ),
      },
    });
  } catch (error) {
    console.error("Submit quiz error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to submit quiz",
    });
  }
};

module.exports = {
  createQuiz,
  getInstructorQuizzes,
  getStudentQuizzes,
  submitQuiz,
  toggleQuizPublish,
};