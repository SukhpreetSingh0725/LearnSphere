import { useState, useEffect } from "react";
import "./InstructorCourses.css";
import { useAuth } from "../context/AuthContext";

function InstructorCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
  
        const response = await fetch(
          "http://localhost:5000/api/courses/my-courses",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );
  
        const result = await response.json();
  
        if (response.ok && result.success) {
          setCourses(result.data);
        } else {
          console.error(result.message || "Unable to fetch courses");
        }
      } catch (error) {
        console.error("Fetch courses error:", error);
      } finally {
        setLoading(false);
      }
    };
  
    if (token) {
      fetchCourses();
    }
  }, [token]);

  return (
    <div className="instructor-courses">

      <div className="courses-header">
        <div>
          <h2>My Courses</h2>
          <p>Manage and track all your courses.</p>
        </div>

        <button className="create-course-btn">
          + Create New Course
        </button>
      </div>

      <div className="courses-summary">
        <div className="course-summary-card">
          <span>Total Courses</span>
          <h3>{courses.length}</h3>
        </div>

        <div className="course-summary-card">
          <span>Published</span>
          <h3>
            {courses.filter(course => course.status === "published").length}
          </h3>
        </div>

        <div className="course-summary-card">
          <span>Pending</span>
          <h3>
            {courses.filter(course => course.status === "pending").length}
          </h3>
        </div>

        <div className="course-summary-card">
          <span>Drafts</span>
          <h3>
            {courses.filter(course => course.status === "draft").length}
          </h3>
        </div>
      </div>

      <div className="courses-list-section">
        <h3>All Courses</h3>

        {loading ? (
          <p>Loading courses...</p>
        ) : courses.length === 0 ? (
          <div className="empty-courses">
            <h3>No courses yet</h3>
            <p>Your created courses will appear here.</p>
          </div>
        ) : (
          
            <div className="instructor-course-list">
              {courses.map((course) => (
                <div className="instructor-course-card" key={course._id}>

                  <div className="course-card-top">
                    <div>
                      <span className="course-category">
                        {course.category}
                      </span>

                      <h3>{course.title}</h3>
                      <p>{course.description}</p>
                    </div>

                    <span className={`course-status ${course.status}`}>
                      {course.status}
                    </span>
                  </div>

                  <div className="course-card-details">
                    <span>{course.level}</span>
                    <span>₹{course.price}</span>
                    <span>⭐ {course.rating || 0}</span>
                  </div>

                  <div className="course-card-actions">
                    <button type="button">Edit</button>
                    <button type="button" className="delete-course-btn">
                      Delete
                    </button>

                    {course.status === "draft" && (
                      <button type="button" className="submit-course-btn">
                        Submit for Approval
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>

        )}
      </div>

    </div>
  );
}

export default InstructorCourses;
