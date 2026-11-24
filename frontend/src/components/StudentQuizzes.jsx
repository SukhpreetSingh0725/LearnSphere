
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function StudentQuizzes({ courseId }) {
  const { token } = useAuth();

  const [quizzes, setQuizzes] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    const fetchQuizzes = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/quizzes/courses/${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load quizzes.");
        }

        if (!ignore) {
          setQuizzes(data.data);
        }
      } catch (error) {
        if (!ignore) {
          setMessage(error.message || "Unable to load quizzes.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    if (token && courseId) {
      fetchQuizzes();
    }

    return () => {
      ignore = true;
    };
  }, [courseId, token]);

  const handleAnswerChange = (quizId, questionId, selectedAnswer) => {
    setAnswers((previous) => ({
      ...previous,
      [quizId]: {
        ...previous[quizId],
        [questionId]: Number(selectedAnswer),
      },
    }));
  };

  const handleSubmit = async (quiz) => {
    const quizAnswers = answers[quiz._id] || {};

    if (quiz.questions.some((question) => quizAnswers[question._id] === undefined)) {
      setMessage("Please answer every question before submitting.");
      return;
    }

    try {
      setSubmitting(quiz._id);
      setMessage("");

      const response = await fetch(
        `http://localhost:5000/api/quizzes/${quiz._id}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            answers: quiz.questions.map((question) => ({
              questionId: question._id,
              selectedAnswer: quizAnswers[question._id],
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to submit quiz.");
      }

      setResults((previous) => ({
        ...previous,
        [quiz._id]: data.data,
      }));
    } catch (error) {
      setMessage(error.message || "Unable to submit quiz.");
    } finally {
      setSubmitting("");
    }
  };

  if (loading) {
    return <p>Loading quizzes...</p>;
  }

  return (
    <section style={{ marginTop: "30px" }}>
      <h2>Course Quizzes</h2>

      {message && <p>{message}</p>}

      {quizzes.length === 0 ? (
        <p>No published quizzes available for this course yet.</p>
      ) : (
        quizzes.map((quiz) => {
          const result = results[quiz._id];

          return (
            <div
              key={quiz._id}
              style={{
                marginTop: "20px",
                padding: "20px",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
              }}
            >
              <h3>{quiz.title}</h3>
              <p>{quiz.description}</p>
              <p>Passing Score: {quiz.passingScore}%</p>
              <p>Maximum Attempts: {quiz.maxAttempts}</p>

              {quiz.questions.map((question, index) => (
                <div key={question._id} style={{ marginTop: "20px" }}>
                  <h4>
                    {index + 1}. {question.question}
                  </h4>

                  {question.options.map((option, optionIndex) => (
                    <label
                      key={optionIndex}
                      style={{
                        display: "block",
                        margin: "10px 0",
                      }}
                    >
                      <input
                        type="radio"
                        name={`${quiz._id}-${question._id}`}
                        value={optionIndex}
                        checked={
                          answers[quiz._id]?.[question._id] === optionIndex
                        }
                        onChange={() =>
                          handleAnswerChange(
                            quiz._id,
                            question._id,
                            optionIndex
                          )
                        }
                      />{" "}
                      {option}
                    </label>
                  ))}
                </div>
              ))}

              <button
                type="button"
                onClick={() => handleSubmit(quiz)}
                disabled={submitting === quiz._id}
                style={{ marginTop: "15px" }}
              >
                {submitting === quiz._id ? "Submitting..." : "Submit Quiz"}
              </button>

              {result && (
                <div style={{ marginTop: "20px" }}>
                  <h3>Quiz Result</h3>
                  <p>Score: {result.score}%</p>
                  <p>
                    Correct Answers: {result.correctCount} / {result.totalQuestions}
                  </p>
                  <p>{result.passed ? "Passed" : "Not Passed"}</p>
                  <p>Attempt: {result.attemptNumber}</p>
                  <p>Remaining Attempts: {result.remainingAttempts}</p>
                </div>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}

export default StudentQuizzes;
