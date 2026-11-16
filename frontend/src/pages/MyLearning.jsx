import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./MyLearning.css";

function MyLearning() {
  const { token } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

        setCourses(data.data || []);
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
          <h3>
            {courses.filter(
              (item) => item.status === "completed"
            ).length}
          </h3>
          <p>Completed Courses</p>
        </div>

        <div>
          <h3>
            {courses.filter(
              (item) => item.status === "active"
            ).length}
          </h3>
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
          {courses.map((item) => (
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

                <span className={`learning-status ${item.status}`}>
                  {item.status}
                </span>

                <button
                  onClick={() => {
                    window.location.href =
                      `/learn/${item.course?._id}`;
                  }}
                >
                  Continue Learning
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyLearning;