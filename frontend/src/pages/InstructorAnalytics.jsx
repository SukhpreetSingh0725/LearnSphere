
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./InstructorAnalytics.css";

function InstructorAnalytics() {
  const { token } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const fetchAnalytics = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/instructor/analytics",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load analytics");
        }

        if (!ignore) {
          setAnalytics(data.data);
        }
      } catch (error) {
        if (!ignore) {
          setError(error.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();

    return () => {
      ignore = true;
    };
  }, [token]);

  if (loading) {
    return <div className="instructor-analytics">Loading analytics...</div>;
  }

  if (error) {
    return <div className="instructor-analytics analytics-error">{error}</div>;
  }

  if (!analytics) {
    return <div className="instructor-analytics">No analytics available.</div>;
  }

  const stats = [
    { title: "Total Courses", value: analytics.totalCourses },
    { title: "Published Courses", value: analytics.publishedCourses },
    { title: "Pending Courses", value: analytics.pendingCourses },
    { title: "Rejected Courses", value: analytics.rejectedCourses },
    { title: "Total Students", value: analytics.totalStudents },
    { title: "Total Enrollments", value: analytics.totalEnrollments },
    { title: "Active Enrollments", value: analytics.activeEnrollments },
    { title: "Completed Enrollments", value: analytics.completedEnrollments },
  ];

  return (
    <div className="instructor-analytics">
      <div className="analytics-heading">
        <h2>Course Analytics</h2>
        <p>Track your courses and student enrollment performance.</p>
      </div>

      <div className="instructor-analytics-grid">
        {stats.map((item) => (
          <div className="instructor-analytics-card" key={item.title}>
            <p>{item.title}</p>
            <h2>{item.value}</h2>
          </div>
        ))}
      </div>

      <div className="course-performance">
        <h2>Course Performance</h2>

        {analytics.coursePerformance.length === 0 ? (
          <p>No student enrollments yet.</p>
        ) : (
          <div className="performance-list">
            {analytics.coursePerformance.map((course) => (
              <div className="performance-card" key={course.courseId}>
                <div>
                  <h3>{course.title}</h3>
                  <span className="performance-status">
                    {course.status}
                  </span>
                </div>

                <div className="performance-students">
                  <strong>{course.totalStudents}</strong>
                  <span>Students</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default InstructorAnalytics;
