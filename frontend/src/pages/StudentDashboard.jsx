
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import MyLearning from "./MyLearning";
import "./StudentDashboard.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function StudentDashboard() {
  const { token, user } = useAuth();

  const [activeTab, setActiveTab] = useState("Overview");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const menuItems = ["Overview", "My Learning"];

  useEffect(() => {
    const fetchDashboardData = async () => {
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
          throw new Error(data.message || "Unable to load dashboard");
        }

        const enrolledCourses = data.data || [];

        const coursesWithProgress = await Promise.all(
          enrolledCourses.map(async (item) => {
            try {
              const courseId = item.course?._id;

              if (!courseId) {
                return { ...item, progress: null };
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
              return { ...item, progress: null };
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
      fetchDashboardData();
    }
  }, [token]);

  const completedCourses = courses.filter(
    (item) =>
      item.progress?.totalLessons > 0 &&
      item.progress?.percentage === 100
  ).length;

  const inProgressCourses = courses.length - completedCourses;

  const totalLessons = courses.reduce(
    (total, item) => total + (item.progress?.totalLessons || 0),
    0
  );

  const completedLessons = courses.reduce(
    (total, item) => total + (item.progress?.completedLessons || 0),
    0
  );

  const overallProgress = totalLessons === 0
    ? 0
    : Math.round((completedLessons / totalLessons) * 100);

  const recentCourses = courses.slice(0, 3);

  return (
    <div className="student-dashboard">
      <aside className="student-sidebar">
        <h2>LearnSphere</h2>

        {menuItems.map((item) => (
          <button
            key={item}
            className={activeTab === item ? "active" : ""}
            onClick={() => setActiveTab(item)}
          >
            {item}
          </button>
        ))}
      </aside>

      <main className="student-main">
        {activeTab === "Overview" && (
          <div className="student-overview">
            <div className="student-welcome">
              <h1>
                Welcome back{user?.name ? `, ${user.name}` : ""}!
              </h1>
              <p>Track your learning journey and continue building your skills.</p>
            </div>

            {loading ? (
              <p>Loading your dashboard...</p>
            ) : error ? (
              <p className="student-dashboard-error">{error}</p>
            ) : (
              <>
                <div className="student-stats">
                  <div className="student-stat-card">
                    <h3>{courses.length}</h3>
                    <p>Enrolled Courses</p>
                  </div>

                  <div className="student-stat-card">
                    <h3>{completedCourses}</h3>
                    <p>Completed Courses</p>
                  </div>

                  <div className="student-stat-card">
                    <h3>{inProgressCourses}</h3>
                    <p>In Progress</p>
                  </div>

                  <div className="student-stat-card">
                    <h3>{overallProgress}%</h3>
                    <p>Overall Learning Progress</p>
                  </div>
                </div>

                <div className="student-overall-progress">
                  <h2>Overall Learning Progress</h2>

                  <div className="student-progress-track">
                    <div
                      className="student-progress-fill"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>

                  <p>
                    {completedLessons} of {totalLessons} lessons completed
                    across your courses.
                  </p>
                </div>

                <div className="student-recent-courses">
                  <div className="student-section-heading">
                    <h2>Your Courses</h2>

                    <button onClick={() => setActiveTab("My Learning")}>
                      View All
                    </button>
                  </div>

                  {recentCourses.length === 0 ? (
                    <div className="student-empty">
                      <h3>No courses enrolled yet</h3>
                      <p>Explore LearnSphere and start learning today!</p>
                    </div>
                  ) : (
                    <div className="student-recent-grid">
                      {recentCourses.map((item) => (
                        <div className="student-recent-card" key={item._id}>
                          <img
                            src={
                              item.course?.thumbnail ||
                              "https://placehold.co/600x350?text=LearnSphere"
                            }
                            alt={item.course?.title || "Course"}
                          />

                          <div>
                            <h3>{item.course?.title || "Course"}</h3>

                            <p>
                              {item.progress?.completedLessons || 0} of{" "}
                              {item.progress?.totalLessons || 0} lessons completed
                            </p>

                            <div className="student-progress-track">
                              <div
                                className="student-progress-fill"
                                style={{
                                  width: `${item.progress?.percentage || 0}%`,
                                }}
                              />
                            </div>

                            <button
                              onClick={() => {
                                window.location.href = `/learn/${item.course?._id}`;
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
              </>
            )}
          </div>
        )}

        {activeTab === "My Learning" && <MyLearning />}
      </main>
    </div>
  );
}

export default StudentDashboard;
