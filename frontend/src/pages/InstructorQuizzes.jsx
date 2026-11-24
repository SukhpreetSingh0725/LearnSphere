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
    } catch{
      setMessage("Unable to update quiz status.");
    }
  };

  if (loading) {
    return <p>Loading quiz management...</p>;
  }

  return (
    <section>
      <h2>Create Quiz</h2>

      {message && <p>{message}</p>}

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

      <hr />

      <h2>My Quizzes</h2>

      {quizzes.length === 0 ? (
        <p>No quizzes created yet.</p>
      ) : (
        quizzes.map((quiz) => (
          <div key={quiz._id}>
            <h3>{quiz.title}</h3>
            <p>Course: {quiz.course?.title || "Course"}</p>
            <p>Questions: {quiz.questions.length}</p>
            <p>Status: {quiz.isPublished ? "Published" : "Draft"}</p>

            <button onClick={() => handlePublish(quiz._id)}>
              {quiz.isPublished ? "Unpublish" : "Publish"}
            </button>

            <hr />
          </div>
        ))
      )}
    </section>
  );
}

export default InstructorQuizzes;
