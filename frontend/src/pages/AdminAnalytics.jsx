
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./AdminAnalytics.css";

function AdminAnalytics() {
  const { token } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    let ignore = false;

    fetch("http://localhost:5000/api/admin/analytics", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch analytics");
        }

        return data;
      })
      .then((data) => {
        if (!ignore) {
          setAnalytics(data.data);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setError(error.message);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [token]);

  if (loading) {
    return <div className="admin-analytics">Loading analytics...</div>;
  }

  if (error) {
    return <div className="admin-analytics analytics-error">{error}</div>;
  }

  if (!analytics) {
    return <div className="admin-analytics">No analytics available.</div>;
  }

  const sections = [
    {
      title: "Users",
      items: [
        { label: "Total Students", value: analytics.users.totalStudents },
        { label: "Total Instructors", value: analytics.users.totalInstructors },
      ],
    },
    {
      title: "Courses",
      items: [
        { label: "Total Courses", value: analytics.courses.totalCourses },
        { label: "Published Courses", value: analytics.courses.publishedCourses },
        { label: "Pending Courses", value: analytics.courses.pendingCourses },
      ],
    },
    {
      title: "Enrollments",
      items: [
        { label: "Total Enrollments", value: analytics.enrollments.totalEnrollments },
        { label: "Active Enrollments", value: analytics.enrollments.activeEnrollments },
        { label: "Completed Enrollments", value: analytics.enrollments.completedEnrollments },
        { label: "Cancelled Enrollments", value: analytics.enrollments.cancelledEnrollments },
      ],
    },
  ];

  return (
    <div className="admin-analytics">
      <div className="analytics-heading">
        <div>
          <h2>Analytics Overview</h2>
          <p>Monitor LearnSphere platform performance.</p>
        </div>
      </div>

      {sections.map((section) => (
        <section className="analytics-section" key={section.title}>
          <h3>{section.title}</h3>

          <div className="analytics-grid">
            {section.items.map((item) => (
              <div className="analytics-card" key={item.label}>
                <p>{item.label}</p>
                <h2>{item.value}</h2>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="analytics-section">
        <h3>Revenue Overview</h3>
        <div className="analytics-card revenue-placeholder">
          <p>Total Revenue</p>
          <h2>₹0</h2>
          <span>Revenue tracking will be available after Razorpay integration.</span>
        </div>
      </section>
    </div>
  );
}

export default AdminAnalytics;
