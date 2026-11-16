
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./AdminCourses.css";

function AdminCourses() {
  const { token } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/courses/admin/pending",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to fetch courses");
      }

      setCourses(data.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [token]);

  const approveCourse = async (courseId) => {
    try {
      setMessage("");
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/courses/admin/${courseId}/approve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to approve course");
      }

      setMessage("Course approved successfully!");
      await fetchCourses();
    } catch (error) {
      setError(error.message);
    }
  };

  const rejectCourse = async (courseId) => {
    const rejectionReason = window.prompt(
      "Enter the reason for rejecting this course:"
    );

    if (!rejectionReason || !rejectionReason.trim()) {
      return;
    }

    try {
      setMessage("");
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/courses/admin/${courseId}/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rejectionReason }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to reject course");
      }

      setMessage("Course rejected successfully!");
      await fetchCourses();
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) {
    return <p>Loading pending courses...</p>;
  }

  return (
    <div className="admin-courses">
      <div className="admin-courses-header">
        <div>
          <h2>Pending Course Approvals</h2>
          <p>Review and manage courses submitted by instructors.</p>
        </div>

        <span className="admin-course-count">
          {courses.length} Pending
        </span>
      </div>

      {message && (
        <div className="admin-message admin-message-success">
          {message}
        </div>
      )}

      {error && (
        <div className="admin-message admin-message-error">
          {error}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="admin-empty-state">
          <h3>All caught up!</h3>
          <p>There are no pending courses to review.</p>
        </div>
      ) : (
        <div className="admin-course-list">
          {courses.map((course) => (
            <div className="admin-course-card" key={course._id}>
              <div className="admin-course-top">
                <span className="admin-course-category">
                  {course.category}
                </span>

                <span className="admin-course-status">
                  Pending Review
                </span>
              </div>

              <h3>{course.title}</h3>

              <p className="admin-course-description">
                {course.description}
              </p>

              <div className="admin-course-info">
                <div>
                  <span>Instructor</span>
                  <strong>
                    {course.instructor?.name || "Unknown"}
                  </strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>
                    {course.instructor?.email || "N/A"}
                  </strong>
                </div>

                <div>
                  <span>Level</span>
                  <strong>{course.level}</strong>
                </div>

                <div>
                  <span>Course Price</span>
                  <strong>₹{course.price}</strong>
                </div>
              </div>

              <div className="admin-course-actions">
                <button
                  className="admin-approve-btn"
                  onClick={() => approveCourse(course._id)}
                >
                  Approve
                </button>

                <button
                  className="admin-reject-btn"
                  onClick={() => rejectCourse(course._id)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminCourses;
