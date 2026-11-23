import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./MyLearning.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
function MyLearning() {
  const { token } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(
          `${API}/api/enrollments/my-courses`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load courses");
        }

        const enrolledCourses = data.data || [];

        const coursesWithProgress = await Promise.all(
          enrolledCourses.map(async (item) => {
            try {
              const courseId = item.course?._id;

              if (!courseId) {
                return {
                  ...item,
                  progress: {
                    totalLessons: 0,
                    completedLessons: 0,
                    percentage: 0,
                  },
                };
              }

              const progressResponse = await fetch(
                `${API}/api/progress/${courseId}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                  cache: "no-store",
                }
              );

              const progressData = await progressResponse.json();

              if (!progressResponse.ok) {
                throw new Error("Unable to load course progress");
              }

              return {
                ...item,
                progress: progressData.data,
              };
            } catch (err) {
              console.error(err.message);

              return {
                ...item,
                progress: {
                  totalLessons: 0,
                  completedLessons: 0,
                  percentage: 0,
                },
              };
            }
          })
        );

        setCourses(coursesWithProgress);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCourses();
    }
  }, [token]);

  if (loading) {
    return <p className="learning-message">Loading your courses...</p>;
  }

  if (error) {
    return <p className="learning-error">{error}</p>;
  }

  const completedCourses = courses.filter(
    (item) => item.progress?.percentage === 100 &&
      item.progress?.totalLessons > 0
  ).length;

  const inProgressCourses = courses.filter(
    (item) =>
      item.progress?.percentage > 0 &&
      item.progress?.percentage < 100
  ).length;

  return (
    <div className="my-learning">
      <div className="learning-heading">
        <h2>My Learning</h2>
        <p>Continue learning and improve your skills.</p>
      </div>

      <div className="learning-summary">
        <div>
          <h3>{courses.length}</h3>
          <p>Enrolled Courses</p>
        </div>

        <div>
          <h3>{completedCourses}</h3>
          <p>Completed Courses</p>
        </div>

        <div>
          <h3>{inProgressCourses}</h3>
          <p>In Progress</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="learning-empty">
          <h3>No enrolled courses yet</h3>
          <p>Explore courses and start your learning journey!</p>
        </div>
      ) : (
        <div className="learning-grid">
          {courses.map((item) => {
            const progress = item.progress || {};
            const percentage = progress.percentage || 0;

            return (
              <div className="learning-card" key={item._id}>
                <img
                  src={
                    item.course?.thumbnail ||
                    "https://placehold.co/600x350?text=LearnSphere"
                  }
                  alt={item.course?.title || "Course"}
                />

                <div className="learning-card-content">
                  <h3>{item.course?.title || "Course"}</h3>

                  <p>
                    Instructor: {item.course?.instructor?.name || "Instructor"}
                  </p>

                  <p>
                    Enrolled:{" "}
                    {item.enrolledAt
                      ? new Date(item.enrolledAt).toLocaleDateString()
                      : "N/A"}
                  </p>

                  <div className="course-progress">
                    <div className="course-progress-heading">
                      <span>Course Progress</span>
                      <strong>{percentage}%</strong>
                    </div>

                    <div className="course-progress-track">
                      <div
                        className="course-progress-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <p>
                      {progress.completedLessons || 0} of{" "}
                      {progress.totalLessons || 0} lessons completed
                    </p>
                  </div>

                  <span
                    className={`learning-status ${
                      percentage === 100 && progress.totalLessons > 0
                        ? "completed"
                        : "active"
                    }`}
                  >
                    {percentage === 100 && progress.totalLessons > 0
                      ? "Completed"
                      : "In Progress"}
                  </span>

                  <button
                    onClick={() => {
                      window.location.href = `/learn/${item.course?._id}`;
                    }}
                  >
                    {percentage === 100 ? "Review Course" : "Continue Learning"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyLearning;
