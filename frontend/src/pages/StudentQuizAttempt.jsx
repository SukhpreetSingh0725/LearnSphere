
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function StudentQuizAttempt() {
  const { courseId, quizId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchQuiz = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/quizzes/${quizId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load quiz");
      }

      setQuiz(data.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [quizId, token]);

  const handleAnswerChange = (questionId, selectedAnswer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedAnswer,
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== quiz.questions.length) {
      setError("Please answer every question before submitting.");
      return;
    }

    if (!window.confirm("Are you sure you want to submit this quiz?")) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/quizzes/${quizId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            answers: Object.entries(answers).map(
              ([questionId, selectedAnswer]) => ({
                questionId,
                selectedAnswer,
              })
            ),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        await fetchQuiz();
        setStarted(false);
        setAnswers({});
        throw new Error(data.message || "Quiz submission failed");
      }

      setResult(data.data);

      setQuiz((prev) => ({
        ...prev,
        remainingAttempts: data.data.remainingAttempts,
        cooldownUntil: data.data.cooldownUntil,
        bestScore: Math.max(
          prev.bestScore || 0,
          data.data.score
        ),
        alreadyPassed: prev.alreadyPassed || data.data.passed,
      }));
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading quiz...</p>;
  if (!quiz) return <p>{error || "Quiz not found."}</p>;

  return (
    <div>
      <button onClick={() => navigate(`/learn/${courseId}`)}>
        Back to Course
      </button>

      <h1>{quiz.title}</h1>
      <p>{quiz.description}</p>

      <p>
        Passing Score: {quiz.passingScore}%
      </p>

      <p>
        Total Attempts: {quiz.totalAttempts}
      </p>
      {quiz.attemptHistory?.length > 0 && (
  <div>
    <h3>Previous Attempts</h3>

    {quiz.attemptHistory.map((attempt) => (
      <div key={attempt._id}>
        <p>
          Attempt {attempt.attemptNumber} (Cycle {attempt.cycleNumber})
        </p>
        <p>Score: {attempt.score}%</p>
        <p>Status: {attempt.passed ? "Passed" : "Failed"}</p>
        <p>
          Submitted: {new Date(attempt.submittedAt).toLocaleString()}
        </p>
      </div>
    ))}
  </div>
)}

      <p>
        Attempts Remaining: {quiz.remainingAttempts}
      </p>

      {quiz.alreadyPassed && (
        <div>
          <h3>You have already passed this quiz!</h3>
          <p>Your Best Score: {quiz.bestScore}%</p>
          <p>You can reattempt the quiz. Your best score will be kept.</p>
        </div>
      )}

      {quiz.cooldownUntil && quiz.remainingAttempts === 0 && (
        <div>
          <h3>Maximum Attempts Reached</h3>
          <p>
            You can attempt this quiz again after:
          </p>
          <strong>
            {new Date(quiz.cooldownUntil).toLocaleString()}
          </strong>
        </div>
      )}

      {result ? (
        <div>
          <h2>Quiz Result</h2>

          <h3>
            Score: {result.score}% (
            {result.correctCount}/{result.totalQuestions})
          </h3>

          <h3>
            {result.passed
              ? "Congratulations! You Passed."
              : "You Did Not Pass."}
          </h3>

          <p>
            Your Best Score: {quiz.bestScore}%
          </p>

          {result.results.map((item, index) => (
            <div key={item.questionId}>
              <h4>
                {index + 1}. {item.question}
              </h4>

              <p>
                Your Answer: {item.selectedAnswerText}
              </p>

              {item.isCorrect ? (
                <p style={{ color: "green" }}>Correct!</p>
              ) : (
                <>
                  <p style={{ color: "red" }}>Incorrect.</p>
                  <p>Correct Answer: {item.correctAnswer}</p>
                </>
              )}
            </div>
          ))}

          {quiz.remainingAttempts > 0 && (
            <button
              onClick={() => {
                setResult(null);
                setAnswers({});
                setStarted(true);
              }}
            >
              Reattempt Quiz
            </button>
          )}

          <button onClick={() => navigate(`/learn/${courseId}`)}>
            Return to Course
          </button>
        </div>
      ) : started && quiz.remainingAttempts > 0 ? (
        <div>
          {quiz.questions.map((question, index) => (
            <div key={question._id}>
              <h3>
                {index + 1}. {question.question}
              </h3>

              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} style={{ display: "block" }}>
                  <input
                    type="radio"
                    name={question._id}
                    checked={answers[question._id] === optionIndex}
                    onChange={() =>
                      handleAnswerChange(question._id, optionIndex)
                    }
                  />
                  {option}
                </label>
              ))}
            </div>
          ))}

          {error && <p>{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      ) : (
        <div>
          {error && <p>{error}</p>}

          {quiz.remainingAttempts > 0 ? (
            <button onClick={() => setStarted(true)}>
              {quiz.alreadyPassed ? "Reattempt Quiz" : "Start Quiz"}
            </button>
          ) : (
            <p>You cannot attempt this quiz right now.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentQuizAttempt;
