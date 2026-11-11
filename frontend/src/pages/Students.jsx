import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./Students.css";

function Students() {
  const [searchTerm, setSearchTerm] = useState("");
  const { token } = useAuth();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError("");
  
        const response = await fetch(
          "http://localhost:5000/api/courses/my-courses",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch courses");
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

  return (
    <div className="students-page">
      <div className="students-heading">
        <div>
          <h2>My Students</h2>
          <p>Manage and monitor students enrolled in your courses.</p>
        </div>
      </div>

      <div className="students-stats">
        <div className="student-stat-card">
          <h3>Total Students</h3>
          <p>0</p>
        </div>

        <div className="student-stat-card">
          <h3>Active Students</h3>
          <p>0</p>
        </div>

        <div className="student-stat-card">
          <h3>Total Courses</h3>
          <p>0</p>
        </div>
      </div>

      <div className="students-content">
      <div className="students-toolbar">
        <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
          <select
            className="students-course-filter"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="all">All Courses</option>

            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
        {loading && <p>Loading courses...</p>}

        {error && <p className="students-error">{error}</p>}

        <div className="students-table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Course</th>
                <th>Enrollment Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan="5" className="students-empty-cell">
                  {loading
                    ? "Loading students..."
                    : "No students enrolled yet."}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Students;
