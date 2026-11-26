import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function InstructorQuizzes() {
  const { token } = useAuth();

  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [quizLessons, setQuizLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState(60);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [attemptCooldownHours, setAttemptCooldownHours] = useState(24);
  const [questions, setQuestions] = useState([
    {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activePage, setActivePage] = useState("create");
  const [viewingQuiz, setViewingQuiz] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPassingScore, setEditPassingScore] = useState(60);
  const [editMaxAttempts, setEditMaxAttempts] = useState(3);
  const [editAttemptCooldownHours, setEditAttemptCooldownHours] = useState(24);

  const [editQuestions, setEditQuestions] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);
  // Your Quizzes filters
  const [managementCourse, setManagementCourse] = useState("");
  const [managementSection, setManagementSection] = useState("");
  const [managementSections, setManagementSections] = useState([]);

  // Student Attempts filters
  const [attemptCourse, setAttemptCourse] = useState("");
  const [attemptSection, setAttemptSection] = useState("");
  const [attemptQuizId, setAttemptQuizId] = useState("");
  const [attemptSections, setAttemptSections] = useState([]);
  // Student Attempts data
const [selectedAttemptQuiz, setSelectedAttemptQuiz] = useState(null);
const [quizAttemptStudents, setQuizAttemptStudents] = useState([]);
const [quizAttemptStats, setQuizAttemptStats] = useState(null);
const [attemptSearch, setAttemptSearch] = useState("");
const [attemptStatusFilter, setAttemptStatusFilter] = useState("all");
const [loadingAttempts, setLoadingAttempts] = useState(false);

  const fetchData = useCallback(async (ignore = false) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [courseResponse, quizResponse] = await Promise.all([
        fetch("http://localhost:5000/api/courses/my-courses", { headers }),
        fetch("http://localhost:5000/api/quizzes/instructor", { headers }),
      ]);

      const courseData = await courseResponse.json();
      const quizData = await quizResponse.json();
      if (!ignore && courseResponse.ok && courseData.success) {
        setCourses(courseData.data);
      }

      if (!ignore && quizResponse.ok && quizData.success) {
        setQuizzes(quizData.data);
      }
    } catch {
      setMessage("Unable to load quiz management data.");
    } finally {
        if (!ignore) {
            setLoading(false);
          }
      }
    }, [token]);

    useEffect(() => {
        let ignore = false;

        const loadData = async () => {
          if (!token) return;

          await fetchData(ignore);
        };

        loadData();

        return () => {
          ignore = true;
        };
      }, [token, fetchData]);

      useEffect(() => {
        let ignore = false;

        const fetchQuizLessons = async () => {
          if (!selectedCourse) {
            setQuizLessons([]);
            setSelectedLesson("");
            return;
          }

          try {
            const response = await fetch(
              `http://localhost:5000/api/courses/${selectedCourse}/sections`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
              throw new Error(data.message || "Unable to load lessons.");
            }

            const lessons = data.data.flatMap((section) =>
              section.lessons
                .filter((lesson) => lesson.type === "quiz")
                .map((lesson) => ({
                  ...lesson,
                  sectionTitle: section.title,
                }))
            );

            if (!ignore) {
              setQuizLessons(lessons);
              setSelectedLesson("");
            }
          } catch (error) {
            if (!ignore) {
              setMessage(error.message);
            }
          }
        };

        fetchQuizLessons();

        return () => {
          ignore = true;
        };
      }, [selectedCourse, token]);

      const fetchFilterSections = async (courseId, setSectionList) => {
        if (!courseId) {
            setSectionList([]);
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:5000/api/courses/${courseId}/sections`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to load sections.");
            }

            setSectionList(data.data || []);
        } catch (error) {
            setMessage(error.message);
            setSectionList([]);
        }
    };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ]);
  };

  const updateQuestion = (questionIndex, value) => {
    const updated = [...questions];
    updated[questionIndex].question = value;
    setQuestions(updated);
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
  };

  const updateCorrectAnswer = (questionIndex, value) => {
    const updated = [...questions];
    updated[questionIndex].correctAnswer = Number(value);
    setQuestions(updated);
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!selectedCourse) {
      setMessage("Please select a course.");
      return;
    }
    if (!selectedLesson) {
      setMessage("Please select a quiz lesson.");
      return;
    }

    if (
      questions.some(
        (q) =>
          !q.question.trim() ||
          q.options.some((option) => !option.trim())
      )
    ) {
      setMessage("Please complete every question and option.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `http://localhost:5000/api/quizzes/courses/${selectedCourse}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            description,
            lessonId: selectedLesson,
            passingScore: Number(passingScore),
            maxAttempts: Number(maxAttempts),
            attemptCooldownHours: Number(attemptCooldownHours),
            questions,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "Unable to create quiz.");
        return;
      }

      setMessage("Quiz created successfully!");

      setTitle("");
      setDescription("");
      setPassingScore(60);
      setMaxAttempts(3);
      setAttemptCooldownHours(24);
      setQuestions([
        {
          question: "",
          options: ["", "", "", ""],
          correctAnswer: 0,
        },
      ]);

      await fetchData();
    } catch {
      setMessage("Something went wrong while creating the quiz.");
    } finally {
      setSaving(false);
    }
  };


const handlePublish = async (quizId) => {
  const quiz = quizzes.find((item) => item._id === quizId);

  if (!quiz) return;

  const action = quiz.isPublished ? "unpublish" : "publish";

  const confirmed = window.confirm(
    `Are you sure you want to ${action} "${quiz.title}"?`
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `http://localhost:5000/api/quizzes/${quizId}/publish`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      setMessage(data.message || "Unable to update quiz status.");
      return;
    }

    setMessage(data.message);
    await fetchData();
  } catch {
    setMessage("Unable to update quiz status.");
  }
};

const handleStartEdit = (quiz) => {
  setEditTitle(quiz.title);
  setEditDescription(quiz.description || "");
  setEditPassingScore(quiz.passingScore);
  setEditMaxAttempts(quiz.maxAttempts);
  setEditAttemptCooldownHours(quiz.attemptCooldownHours);

  setEditQuestions(
    quiz.questions.map((question) => ({
      question: question.question,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
    }))
  );

  setEditingQuiz(true);
};

const handleSaveEdit = async (e) => {
  e.preventDefault();
  setMessage("");

  if (
    !editTitle.trim() ||
    editQuestions.length === 0 ||
    editQuestions.some(
      (q) =>
        !q.question.trim() ||
        q.options.length < 2 ||
        q.options.some((option) => !option.trim()) ||
        q.correctAnswer < 0 ||
        q.correctAnswer >= q.options.length
    )
  ) {
    setMessage("Please complete all questions and options.");
    return;
  }

  try {
    setSavingEdit(true);

    const response = await fetch(
      `http://localhost:5000/api/quizzes/${viewingQuiz._id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          passingScore: Number(editPassingScore),
          maxAttempts: Number(editMaxAttempts),
          attemptCooldownHours: Number(editAttemptCooldownHours),
          questions: editQuestions,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      setMessage(data.message || "Unable to update quiz.");
      return;
    }

    setQuizzes((previous) =>
      previous.map((quiz) =>
        quiz._id === viewingQuiz._id
          ? { ...quiz, ...data.quiz, course: quiz.course, lesson: quiz.lesson }
          : quiz
      )
    );

    setViewingQuiz((previous) => ({
      ...previous,
      ...data.quiz,
      course: previous.course,
      lesson: previous.lesson,
    }));

    setEditingQuiz(false);
    setMessage("Quiz updated successfully!");
  } catch {
    setMessage("Unable to update quiz.");
  } finally {
    setSavingEdit(false);
  }
};

const handleEditQuestionChange = (index, value) => {
  setEditQuestions((previous) =>
    previous.map((question, i) =>
      i === index ? { ...question, question: value } : question
    )
  );
};

const handleEditOptionChange = (questionIndex, optionIndex, value) => {
  setEditQuestions((previous) =>
    previous.map((question, i) =>
      i === questionIndex
        ? {
            ...question,
            options: question.options.map((option, j) =>
              j === optionIndex ? value : option
            ),
          }
        : question
    )
  );
};

const handleEditCorrectAnswerChange = (questionIndex, value) => {
  setEditQuestions((previous) =>
    previous.map((question, i) =>
      i === questionIndex
        ? { ...question, correctAnswer: Number(value) }
        : question
    )
  );
};

const handleAddEditQuestion = () => {
  setEditQuestions((previous) => [
    ...previous,
    {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
    },
  ]);
};

const handleRemoveEditQuestion = (index) => {
  if (editQuestions.length === 1) return;

  setEditQuestions((previous) =>
    previous.filter((_, i) => i !== index)
  );
};

const handleViewQuizAttempts = async (quiz) => {
  try {
      setLoadingAttempts(true);
      setMessage("");

      setSelectedAttemptQuiz(quiz);
      setActivePage("attempts");
      setViewingStudent(null);

      const response = await fetch(
          `http://localhost:5000/api/quizzes/${quiz._id}/attempts`,
          {
              headers: {
                  Authorization: `Bearer ${token}`,
              },
          }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load quiz attempts.");
      }

      setQuizAttemptStudents(data.data || []);
      setQuizAttemptStats(data.stats || null);
      setAttemptSearch("");
      setAttemptStatusFilter("all");

  } catch (error) {
      setMessage(error.message);
  } finally {
      setLoadingAttempts(false);
  }
};

const filteredManagementQuizzes = quizzes.filter((quiz) => {
  const matchesCourse =
      !managementCourse ||
      quiz.course?._id === managementCourse;

  const matchesSection =
      !managementSection ||
      quiz.lesson?.section?._id === managementSection;

  return matchesCourse && matchesSection;
});

const filteredAttemptQuizzes = quizzes.filter((quiz) => {
  const matchesCourse =
      !attemptCourse ||
      quiz.course?._id === attemptCourse;

  const matchesSection =
      !attemptSection ||
      quiz.lesson?.section?._id === attemptSection;

  return matchesCourse && matchesSection;
});

  if (loading) {
    return <p>Loading quiz management...</p>;
  }
  const filteredQuizAttemptStudents = quizAttemptStudents.filter((item) => {
    const studentName = item.student?.name?.toLowerCase() || "";
    const studentEmail = item.student?.email?.toLowerCase() || "";
    const search = attemptSearch.toLowerCase();

    const matchesSearch =
        studentName.includes(search) ||
        studentEmail.includes(search);

    const matchesStatus =
        attemptStatusFilter === "all" ||
        (attemptStatusFilter === "attempted" && item.attempted) ||
        item.status === attemptStatusFilter;

    return matchesSearch && matchesStatus;
});

  return (
    <section>
      {activePage === "create" && <h2>Create Quiz</h2>}

      {message && <p>{message}</p>}
      <div>
    <button
        type="button"
        onClick={() => {
            setActivePage("create");
            setViewingQuiz(null);
            setViewingStudent(null);
        }}
    >
        Create Quiz
    </button>

    <button
        type="button"
        onClick={() => {
            setActivePage("quizzes");
            setViewingQuiz(null);
            setViewingStudent(null);
        }}
    >
        Your Quizzes
    </button>

    <button
        type="button"
        onClick={() => {
            setActivePage("attempts");
            setViewingQuiz(null);
            setViewingStudent(null);
        }}
    >
        Student Attempts
    </button>
</div>
{activePage === "create" && (
    <>
      <form onSubmit={handleCreateQuiz}>
        <div>
          <label>Select Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            required
          >
            <option value="">Choose a course</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
        <div>
            <label>Select Quiz Lesson</label>
            <select
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              required
              disabled={!selectedCourse || quizLessons.length === 0}
            >
              <option value="">Choose a quiz lesson</option>

              {quizLessons.map((lesson) => (
                <option key={lesson._id} value={lesson._id}>
                  {lesson.sectionTitle} — {lesson.title}
                </option>
              ))}
            </select>

            {selectedCourse && quizLessons.length === 0 && (
              <p>No quiz-type lessons found. Create one in Curriculum Builder first.</p>
            )}
          </div>

        <div>
          <label>Quiz Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter quiz title"
            required
          />
        </div>

        <div>
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter quiz description"
          />
        </div>

        <div>
          <label>Passing Score (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={passingScore}
            onChange={(e) => setPassingScore(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Maximum Attempts</label>
          <input
            type="number"
            min="1"
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(e.target.value)}
            required
          />
        </div>
          <div>
          <label>Cooldown After Exhausting Attempts (Hours)</label>
          <input
            type="number"
            min="0"
            max="720"
            value={attemptCooldownHours}
            onChange={(e) => setAttemptCooldownHours(e.target.value)}
            required
          />
          <small>
            Students can attempt the quiz again after this waiting period.
            Enter 0 for no waiting period.
          </small>
        </div>

        <hr />

        <h3>Questions</h3>

        {questions.map((question, questionIndex) => (
          <div key={questionIndex}>
            <h4>Question {questionIndex + 1}</h4>

            <input
              type="text"
              value={question.question}
              onChange={(e) =>
                updateQuestion(questionIndex, e.target.value)
              }
              placeholder="Enter question"
              required
            />

            {question.options.map((option, optionIndex) => (
              <div key={optionIndex}>
                <input
                  type="text"
                  value={option}
                  onChange={(e) =>
                    updateOption(
                      questionIndex,
                      optionIndex,
                      e.target.value
                    )
                  }
                  placeholder={`Option ${optionIndex + 1}`}
                  required
                />
              </div>
            ))}

            <label>Correct Answer</label>
            <select
              value={question.correctAnswer}
              onChange={(e) =>
                updateCorrectAnswer(questionIndex, e.target.value)
              }
            >
              {question.options.map((_, index) => (
                <option key={index} value={index}>
                  Option {index + 1}
                </option>
              ))}
            </select>

            <hr />
          </div>
        ))}

        <button type="button" onClick={addQuestion}>
          + Add Question
        </button>

        <button type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create Quiz"}
        </button>
      </form>
          </>
        )}

{activePage === "quizzes" && (
    <>
        <hr />

        <h2>Your Quizzes ({filteredManagementQuizzes.length})</h2>
        <div>
    <label>Filter by Course</label>
    <select
        value={managementCourse}
        onChange={(e) => {
            const courseId = e.target.value;
            setManagementCourse(courseId);
            setManagementSection("");
            setViewingQuiz(null);
            fetchFilterSections(courseId, setManagementSections);
        }}
    >
        <option value="">All Courses</option>
        {courses.map((course) => (
            <option key={course._id} value={course._id}>
                {course.title}
            </option>
        ))}
    </select>
</div>

<div>
    <label>Filter by Section</label>
    <select
        value={managementSection}
        onChange={(e) => {
            setManagementSection(e.target.value);
            setViewingQuiz(null);
        }}
        disabled={!managementCourse}
    >
        <option value="">All Sections</option>
        {managementSections.map((section) => (
            <option key={section._id} value={section._id}>
                {section.title}
            </option>
        ))}
    </select>
</div>

{!viewingQuiz && (
    filteredManagementQuizzes.length === 0 ? (
    <p>No quizzes found for the selected filters.</p>
) : (
    <table>
        <thead>
            <tr>
                <th>Quiz Name</th>
                <th>Section</th>
                <th>Lesson</th>
                <th>Published Date</th>
                <th>Questions</th>
                <th>Passing Score</th>
                <th>Status</th>
                <th>Action</th>
            </tr>
        </thead>

        <tbody>
            {filteredManagementQuizzes.map((quiz) => (
                <tr key={quiz._id}>
                    <td>
                        <button
                            type="button"
                            onClick={() => setViewingQuiz(quiz)}
                        >
                            {quiz.title}
                        </button>
                    </td>

                    <td>{quiz.lesson?.section?.title || "N/A"}</td>
                    <td>{quiz.lesson?.title || "N/A"}</td>

                    <td>
                        {quiz.publishedAt
                            ? new Date(quiz.publishedAt).toLocaleDateString()
                            : "Not recorded"}
                    </td>

                    <td>{quiz.questions?.length || 0}</td>
                    <td>{quiz.passingScore}%</td>

                    <td>
                        {quiz.isPublished ? "Published" : "Draft"}
                    </td>

                    <td>
                        <button
                            type="button"
                            onClick={() => handlePublish(quiz._id)}
                        >
                            {quiz.isPublished ? "Unpublish" : "Publish"}
                        </button>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
    )
  )}


{viewingQuiz && (
  <div>
    <button
      type="button"
      onClick={() => {
        setViewingQuiz(null);
        setEditingQuiz(false);
      }}
    >
      Back to Quizzes
    </button>

    <hr />

    {editingQuiz ? (
      <form onSubmit={handleSaveEdit}>
        <h2>Edit Quiz</h2>

        <label>Quiz Title</label>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          required
        />

        <label>Description</label>
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
        />

        <label>Passing Score (%)</label>
        <input
          type="number"
          min="0"
          max="100"
          value={editPassingScore}
          onChange={(e) => setEditPassingScore(e.target.value)}
          required
        />

        <label>Maximum Attempts</label>
        <input
          type="number"
          min="1"
          value={editMaxAttempts}
          onChange={(e) => setEditMaxAttempts(e.target.value)}
          required
        />

        <label>Cooldown (Hours)</label>
        <input
          type="number"
          min="0"
          max="720"
          value={editAttemptCooldownHours}
          onChange={(e) => setEditAttemptCooldownHours(e.target.value)}
          required
        />

        <hr />

        <h3>Questions</h3>

        {editQuestions.map((question, index) => (
          <div key={index}>
            <h4>Question {index + 1}</h4>

            <input
              type="text"
              placeholder="Enter question"
              value={question.question}
              onChange={(e) =>
                handleEditQuestionChange(index, e.target.value)
              }
              required
            />

            {question.options.map((option, optionIndex) => (
              <div key={optionIndex}>
                <input
                  type="text"
                  placeholder={`Option ${optionIndex + 1}`}
                  value={option}
                  onChange={(e) =>
                    handleEditOptionChange(
                      index,
                      optionIndex,
                      e.target.value
                    )
                  }
                  required
                />

                <label>
                  <input
                    type="radio"
                    name={`correct-answer-${index}`}
                    checked={question.correctAnswer === optionIndex}
                    onChange={() =>
                      handleEditCorrectAnswerChange(index, optionIndex)
                    }
                  />
                  Correct Answer
                </label>
              </div>
            ))}

            <button
              type="button"
              onClick={() => handleRemoveEditQuestion(index)}
              disabled={editQuestions.length === 1}
            >
              Remove Question
            </button>

            <hr />
          </div>
        ))}

        <button type="button" onClick={handleAddEditQuestion}>
          + Add Question
        </button>

        <hr />

        <button type="submit" disabled={savingEdit}>
          {savingEdit ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={() => setEditingQuiz(false)}
          disabled={savingEdit}
        >
          Cancel
        </button>
      </form>
    ) : (
      <>
        <h2>{viewingQuiz.title}</h2>

        <p>Course: {viewingQuiz.course?.title || "N/A"}</p>
        <p>Section: {viewingQuiz.lesson?.section?.title || "N/A"}</p>
        <p>Lesson: {viewingQuiz.lesson?.title || "N/A"}</p>
        <p>Description: {viewingQuiz.description || "No description"}</p>
        <p>Questions: {viewingQuiz.questions?.length || 0}</p>
        <p>Passing Score: {viewingQuiz.passingScore}%</p>
        <p>Maximum Attempts: {viewingQuiz.maxAttempts}</p>
        <p>Cooldown: {viewingQuiz.attemptCooldownHours} hours</p>
        <p>Status: {viewingQuiz.isPublished ? "Published" : "Draft"}</p>

        <h3>Quiz Questions</h3>

        {viewingQuiz.questions?.map((question, index) => (
          <div key={index}>
            <h4>Question {index + 1}: {question.question}</h4>

            {question.options.map((option, optionIndex) => (
              <p key={optionIndex}>
                Option {optionIndex + 1}: {option}
                {question.correctAnswer === optionIndex
                  ? " ✓ Correct Answer"
                  : ""}
              </p>
            ))}

            <hr />
          </div>
        ))}

        <button
          type="button"
          onClick={() => handleStartEdit(viewingQuiz)}
        >
          Edit Quiz
        </button>

        <button
          type="button"
          onClick={() => handlePublish(viewingQuiz._id)}
        >
          {viewingQuiz.isPublished ? "Unpublish" : "Publish"}
        </button>
      </>
    )}
  </div>
)}
</>
)}


{activePage === "attempts" && (
    <div>
        <hr />
        <h2>Student Attempts</h2>

        <div>
            <label>Filter by Course</label>
            <select
                value={attemptCourse}
                onChange={(e) => {
                    const courseId = e.target.value;

                    setAttemptCourse(courseId);
                    setAttemptSection("");
                    setAttemptQuizId("");
                    setSelectedAttemptQuiz(null);
                    setQuizAttemptStudents([]);
                    setQuizAttemptStats(null);
                    setViewingStudent(null);

                    fetchFilterSections(courseId, setAttemptSections);
                }}
            >
                <option value="">Choose a course</option>

                {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                        {course.title}
                    </option>
                ))}
            </select>
        </div>

        <div>
            <label>Filter by Section</label>
            <select
                value={attemptSection}
                onChange={(e) => {
                    setAttemptSection(e.target.value);
                    setAttemptQuizId("");
                    setSelectedAttemptQuiz(null);
                    setQuizAttemptStudents([]);
                    setQuizAttemptStats(null);
                    setViewingStudent(null);
                }}
                disabled={!attemptCourse}
            >
                <option value="">Choose a section</option>

                {attemptSections.map((section) => (
                    <option key={section._id} value={section._id}>
                        {section.title}
                    </option>
                ))}
            </select>
        </div>

        <div>
            <label>Select Quiz</label>
            <select
                value={attemptQuizId}
                disabled={!attemptSection}
                onChange={(e) => {
                    const quizId = e.target.value;
                    setAttemptQuizId(quizId);

                    const quiz = filteredAttemptQuizzes.find(
                        (item) => item._id === quizId
                    );

                    if (quiz) {
                        handleViewQuizAttempts(quiz);
                    } else {
                        setSelectedAttemptQuiz(null);
                        setQuizAttemptStudents([]);
                        setQuizAttemptStats(null);
                    }
                }}
            >
                <option value="">Choose a quiz</option>

                {filteredAttemptQuizzes.map((quiz) => (
                    <option key={quiz._id} value={quiz._id}>
                        {quiz.title}
                    </option>
                ))}
                       </select>
        </div>

        {selectedAttemptQuiz && (
    <>
        {!viewingStudent && quizAttemptStats && (
                    <>
                        <hr />
                        <h3>Quiz Performance: {selectedAttemptQuiz.title}</h3>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                                gap: "12px",
                                marginBottom: "20px"
                            }}
                        >
                            {[
                                {
                                    label: "Total Students",
                                    value: quizAttemptStats.totalStudents
                                },
                                {
                                    label: "Attempted",
                                    value: quizAttemptStats.attempted
                                },
                                {
                                    label: "Not Attempted",
                                    value: quizAttemptStats.notAttempted
                                },
                                {
                                    label: "Passed",
                                    value: quizAttemptStats.passed
                                },
                                {
                                    label: "Failed",
                                    value: quizAttemptStats.failed
                                },
                                {
                                    label: "Total Attempts",
                                    value: quizAttemptStats.totalAttempts
                                }
                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    style={{
                                        border: "1px solid #ddd",
                                        borderRadius: "8px",
                                        padding: "14px"
                                    }}
                                >
                                    <p>{stat.label}</p>
                                    <h3>{stat.value ?? 0}</h3>
                                </div>
                            ))}
                        </div>
                    </>
                )}
    <div>
        {viewingStudent ? (
            <div>
                <button
                    type="button"
                    onClick={() => setViewingStudent(null)}
                >
                    Back to Student List
                </button>

                <hr />

                <h3>Student Quiz History</h3>

                <h4>{viewingStudent.student.name}</h4>
                <p>Email: {viewingStudent.student.email}</p>
                <p>Total Attempts: {viewingStudent.attemptsCount}</p>
                <p>
                    Best Score: {viewingStudent.bestScore === null
                        ? "Not attempted"
                        : `${viewingStudent.bestScore}%`}
                </p>
                <p>
                    Overall Result: {
                        viewingStudent.status === "passed"
                            ? "Passed"
                            : viewingStudent.status === "failed"
                                ? "Failed"
                                : "Not Attempted"
                    }
                </p>

                <hr />

                <h3>Attempt History</h3>

                {viewingStudent.attempts.length === 0 ? (
                    <p>This student has not attempted this quiz yet.</p>
                ) : (
                    viewingStudent.attempts.map((attempt) => (
                        <div key={attempt._id}>
                            <h4>
                                Attempt {attempt.attemptNumber}
                                {" "} (Cycle {attempt.cycleNumber})
                            </h4>

                            <p>
                                Submitted: {new Date(
                                    attempt.submittedAt
                                ).toLocaleString()}
                            </p>

                            <p>Score: {attempt.score}%</p>

                            <p>
                                Result: {attempt.passed ? "Passed" : "Failed"}
                            </p>

                            <p>
                                Correct Answers: {
                                    attempt.answers.filter(
                                        (answer) => answer.isCorrect
                                    ).length
                                } / {attempt.totalQuestions}
                            </p>

                            <h4>Question-wise Performance</h4>

                            {attempt.answers.map((answer, questionIndex) => (
                                <div key={answer.questionId}>
                                    <p>
                                        **Question {questionIndex + 1}:**
                                        {" "}{answer.question}
                                    </p>

                                    <p>
                                        Selected Answer: {
                                            answer.selectedAnswerText ?? "Not answered"
                                        }
                                    </p>

                                    <p>
                                        Correct Answer: {answer.correctAnswerText}
                                    </p>

                                    <p>
                                        Result: {answer.isCorrect
                                            ? "Correct"
                                            : "Incorrect"}
                                    </p>

                                    <hr />
                                </div>
                            ))}

                            <hr />
                        </div>
                    ))
                )}
            </div>
        ) : (
            <>
                <hr />
                <h3>Student Performance</h3>

                <input
                    type="text"
                    placeholder="Search student by name or email"
                    value={attemptSearch}
                    onChange={(e) => setAttemptSearch(e.target.value)}
                />

                <select
                    value={attemptStatusFilter}
                    onChange={(e) => setAttemptStatusFilter(e.target.value)}
                >
                    <option value="all">All Students</option>
                    <option value="attempted">Attempted</option>
                    <option value="not_attempted">Not Attempted</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                </select>

                {loadingAttempts ? (
                    <p>Loading students...</p>
                ) : filteredQuizAttemptStudents.length === 0 ? (
                    <p>No students found.</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Email</th>
                                <th>Attempts</th>
                                <th>Best Score</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredQuizAttemptStudents.map((item) => (
                                <tr key={item.student._id}>
                                    <td>{item.student.name}</td>
                                    <td>{item.student.email}</td>
                                    <td>{item.attemptsCount}</td>
                                    <td>
                                        {item.bestScore === null
                                            ? "Not attempted"
                                            : `${item.bestScore}%`}
                                    </td>
                                    <td>
                                        {item.status === "not_attempted"
                                            ? "Not Attempted"
                                            : item.status === "passed"
                                                ? "Passed"
                                                : "Failed"}
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            onClick={() => setViewingStudent(item)}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </>
        )}
        </div>
    </>
)}
    </div>
)}

    </section>
  );
}

export default InstructorQuizzes;
