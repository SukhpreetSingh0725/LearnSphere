const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Lesson = require("../models/Lesson");
const Section = require("../models/Section");
const Progress = require("../models/Progress");

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
      attemptCooldownHours,
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
      attemptCooldownHours:
      attemptCooldownHours === undefined ? 24 : Number(attemptCooldownHours),
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
    })
      .populate("course", "title")
      .populate({
        path: "lesson",
        select: "title section",
        populate: {
          path: "section",
          select: "title"
        }
      });

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

// Get Instructor Quiz Attempts
const getInstructorQuizAttempts = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findOne({
      _id: quizId,
      instructor: req.user._id,
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    const enrollments = await Enrollment.find({
      course: quiz.course,
      status: { $in: ["active", "completed"] },
    }).populate("student", "name email profileImage");

    const attempts = await QuizAttempt.find({
      quiz: quiz._id,
    })
      .populate("student", "name email profileImage")
      .sort({ submittedAt: -1 });

    const attemptsByStudent = new Map();

    attempts.forEach((attempt) => {
      if (!attempt.student) return;

      const studentId = attempt.student._id.toString();

      if (!attemptsByStudent.has(studentId)) {
        attemptsByStudent.set(studentId, []);
      }

      const detailedAnswers = quiz.questions.map((question) => {
        const answer = attempt.answers.find(
          (item) =>
            item.questionId.toString() === question._id.toString()
        );

        const selectedAnswer = answer?.selectedAnswer ?? null;

        return {
          questionId: question._id,
          question: question.question,
          options: question.options,
          selectedAnswer,
          selectedAnswerText:
            selectedAnswer !== null
              ? question.options[selectedAnswer]
              : null,
          correctAnswer: question.correctAnswer,
          correctAnswerText: question.options[question.correctAnswer],
          isCorrect:
            selectedAnswer !== null &&
            selectedAnswer === question.correctAnswer,
        };
      });

      attemptsByStudent.get(studentId).push({
        _id: attempt._id,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        passed: attempt.passed,
        attemptNumber: attempt.attemptNumber,
        cycleNumber: attempt.cycleNumber,
        submittedAt: attempt.submittedAt,
        answers: detailedAnswers,
      });
    });

    const students = enrollments
      .filter((enrollment) => enrollment.student)
      .map((enrollment) => {
        const student = enrollment.student;

        const studentAttempts =
          attemptsByStudent.get(student._id.toString()) || [];

        const bestScore = studentAttempts.length
          ? Math.max(...studentAttempts.map((attempt) => attempt.score))
          : null;

        const passed = studentAttempts.some(
          (attempt) => attempt.passed
        );

        return {
          student,
          attempted: studentAttempts.length > 0,
          attemptsCount: studentAttempts.length,
          bestScore,
          passed,
          status: studentAttempts.length === 0
            ? "not_attempted"
            : passed
              ? "passed"
              : "failed",
          latestAttempt: studentAttempts[0] || null,
          attempts: studentAttempts,
        };
      });

    const attemptedCount = students.filter(
      (student) => student.attempted
    ).length;

    const passedCount = students.filter(
      (student) => student.status === "passed"
    ).length;

    const failedCount = students.filter(
      (student) => student.status === "failed"
    ).length;

    const notAttemptedCount = students.filter(
      (student) => !student.attempted
    ).length;

    return res.status(200).json({
      success: true,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        passingScore: quiz.passingScore,
        maxAttempts: quiz.maxAttempts,
      },
      data: students,
      stats: {
        totalStudents: students.length,
        attempted: attemptedCount,
        notAttempted: notAttemptedCount,
        passed: passedCount,
        failed: failedCount,
        totalAttempts: attempts.length,
      },
    });

  } catch (error) {
    console.error("Get instructor quiz attempts error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch quiz attempts",
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
      quiz.publishedAt = quiz.isPublished ? new Date() : null;
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

    const quizzesWithAttempts = await Promise.all(
      quizzes.map(async (quiz) => {
        const latestAttempt = await QuizAttempt.findOne({
          quiz: quiz._id,
          student: req.user._id,
        }).sort({ submittedAt: -1 });

        const cycleNumber = latestAttempt?.cycleNumber || 1;

        const attemptsUsed = await QuizAttempt.countDocuments({
          quiz: quiz._id,
          student: req.user._id,
          cycleNumber,
        });

        const maxAttempts = quiz.maxAttempts;
        const cooldownHours = quiz.attemptCooldownHours ?? 24;

        let remainingAttempts = Math.max(
          0,
          maxAttempts - attemptsUsed
        );

        let cooldownUntil = null;

        if (attemptsUsed >= maxAttempts && latestAttempt) {
          cooldownUntil = new Date(
            latestAttempt.submittedAt.getTime() +
            cooldownHours * 60 * 60 * 1000
          );

          if (new Date() >= cooldownUntil) {
            remainingAttempts = maxAttempts;
            cooldownUntil = null;
          }
        }

        return {
          ...quiz.toObject(),
          attemptsUsed,
          remainingAttempts,
          cycleNumber,
          cooldownUntil,
          attemptCooldownHours: cooldownHours,
          alreadyPassed: Boolean(latestAttempt?.passed),
        };
      })
    );

    res.json({
      success: true,
      data: quizzesWithAttempts,
    });
  } catch (error) {
    console.error("Get student quizzes error:", error.message);

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

    const maxAttempts = quiz.maxAttempts;
const cooldownHours = quiz.attemptCooldownHours ?? 24;

const previousAttempts = await QuizAttempt.find({
  quiz: quizId,
  student: req.user._id,
}).sort({ submittedAt: -1 });

const latestAttempt = previousAttempts[0] || null;

let cycleNumber = latestAttempt?.cycleNumber || 1;

let cycleAttempts = previousAttempts.filter(
  (attempt) => (attempt.cycleNumber || 1) === cycleNumber
).length;

if (cycleAttempts >= maxAttempts) {
  const cooldownUntil = new Date(
    latestAttempt.submittedAt.getTime() +
    cooldownHours * 60 * 60 * 1000
  );

  if (cooldownHours > 0 && new Date() < cooldownUntil) {
    return res.status(403).json({
      success: false,
      message: "Maximum attempts reached. Please try again after the cooldown.",
      data: {
        remainingAttempts: 0,
        cooldownUntil,
      },
    });
  }

  cycleNumber++;
  cycleAttempts = 0;
}

    if (quiz.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "This quiz has no questions",
      });
    }

    if (answers.length !== quiz.questions.length) {
      return res.status(400).json({
        success: false,
        message: "Please answer every question before submitting",
      });
    }

    const questionIds = new Set();
    let correctCount = 0;
    const savedAnswers = [];
    const results = [];

    for (const answer of answers) {
      const question = quiz.questions.id(answer.questionId);

      if (
        !question ||
        questionIds.has(answer.questionId) ||
        !Number.isInteger(answer.selectedAnswer) ||
        answer.selectedAnswer < 0 ||
        answer.selectedAnswer >= question.options.length
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid quiz answer",
        });
      }

      questionIds.add(answer.questionId);

      const isCorrect =
      question.correctAnswer === answer.selectedAnswer;

    if (isCorrect) {
      correctCount++;
    }

    savedAnswers.push({
      questionId: question._id,
      selectedAnswer: answer.selectedAnswer,
    });

    const questionResult = {
      questionId: question._id,
      question: question.question,
      options: question.options,
      selectedAnswer: answer.selectedAnswer,
      selectedAnswerText: question.options[answer.selectedAnswer],
      isCorrect,
    };

    questionResult.correctAnswer =
    question.options[question.correctAnswer];

    results.push(questionResult);
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
      attemptNumber: cycleAttempts + 1,
      cycleNumber,
    });


let courseProgress = null;

if (passed && quiz.lesson) {
  const sections = await Section.find({
    course: quiz.course,
  }).select("_id");

  const sectionIds = sections.map((section) => section._id);

  const lesson = await Lesson.findOne({
    _id: quiz.lesson,
    section: { $in: sectionIds },
  });

  if (lesson && lesson.type === "quiz") {
    const progress = await Progress.findOneAndUpdate(
      {
        student: req.user._id,
        course: quiz.course,
      },
      {
        $addToSet: {
          completedLessons: lesson._id,
        },
        $set: {
          lastLesson: lesson._id,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    const totalLessons = await Lesson.countDocuments({
      section: { $in: sectionIds },
    });

    const completedCount = progress.completedLessons.length;

    const allCompleted =
      totalLessons > 0 && completedCount >= totalLessons;

    progress.completedAt = allCompleted
      ? progress.completedAt || new Date()
      : null;

    await progress.save();

    if (allCompleted) {
      await Enrollment.updateOne(
        {
          student: req.user._id,
          course: quiz.course,
        },
        {
          $set: { status: "completed" },
        }
      );
    }

    courseProgress = {
      totalLessons,
      completedLessons: completedCount,
      percentage: totalLessons === 0
        ? 0
        : Math.round((completedCount / totalLessons) * 100),
      completedAt: progress.completedAt,
    };
  }
}


    const remainingAttempts = Math.max(
      0,
      maxAttempts - attempt.attemptNumber
    );

    const cooldownUntil =
      remainingAttempts === 0 && !passed
        ? new Date(
            attempt.submittedAt.getTime() +
            cooldownHours * 60 * 60 * 1000
          )
        : null;

    res.status(201).json({
      success: true,
      message: "Quiz submitted successfully",
      data: {
        score,
        correctCount,
        totalQuestions,
        passed,
        results,
        attemptNumber: attempt.attemptNumber,
        cycleNumber,
        remainingAttempts,
        cooldownUntil,
        courseProgress,
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

// Get Single Published Quiz for Student
const getStudentQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findOne({
      _id: quizId,
      isPublished: true,
    })
      .select("-questions.correctAnswer")
      .lean();

    if (!quiz) {
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
        message: "You must be enrolled to access this quiz",
      });
    }

    const attempts = await QuizAttempt.find({
      quiz: quiz._id,
      student: req.user._id,
    }).sort({ submittedAt: -1 });

    const latestAttempt = attempts[0] || null;

    const cycleNumber = latestAttempt?.cycleNumber || 1;

    const currentCycleAttempts = attempts.filter(
      (attempt) => (attempt.cycleNumber || 1) === cycleNumber
    );

    let attemptsUsed = currentCycleAttempts.length;
    let remainingAttempts = Math.max(
      0,
      quiz.maxAttempts - attemptsUsed
    );

    let cooldownUntil = null;
    let activeCycle = cycleNumber;

    if (remainingAttempts === 0 && latestAttempt) {
      const cooldownHours = quiz.attemptCooldownHours ?? 24;

      cooldownUntil = new Date(
        latestAttempt.submittedAt.getTime() +
        cooldownHours * 60 * 60 * 1000
      );

      if (new Date() >= cooldownUntil) {
        activeCycle = cycleNumber + 1;
        attemptsUsed = 0;
        remainingAttempts = quiz.maxAttempts;
        cooldownUntil = null;
      }
    }

    const bestScore = attempts.reduce(
      (best, attempt) => Math.max(best, attempt.score),
      0
    );

    const alreadyPassed = attempts.some(
      (attempt) => attempt.passed
    );

    res.status(200).json({
      success: true,
      data: {
        ...quiz,
        attemptsUsed,
        remainingAttempts,
        cycleNumber: activeCycle,
        cooldownUntil,
        attemptCooldownHours: quiz.attemptCooldownHours ?? 24,
        alreadyPassed,
        bestScore,
        totalAttempts: attempts.length,
        attemptHistory: attempts.map((attempt) => ({
          _id: attempt._id,
          score: attempt.score,
          totalQuestions: attempt.totalQuestions,
          passed: attempt.passed,
          attemptNumber: attempt.attemptNumber,
          cycleNumber: attempt.cycleNumber,
          submittedAt: attempt.submittedAt,
        })),
      },
    });

  } catch (error) {
    console.error("Get student quiz error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to load quiz",
    });
  }
};

module.exports = {
  createQuiz,
  getInstructorQuizzes,
  getInstructorQuizAttempts,
  getStudentQuizzes,
  getStudentQuizById,
  submitQuiz,
  toggleQuizPublish,
};