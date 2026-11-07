import { useState, useEffect } from "react";
import "./InstructorCourses.css";
import { useAuth } from "../context/AuthContext";

function InstructorCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
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

  
const handleSubmitForApproval = async (courseId) => {
  const confirmSubmit = window.confirm(
    "Are you sure you want to submit this course for approval?"
  );

  if (!confirmSubmit) return;

  try {
    const response = await fetch(
      `http://localhost:5000/api/courses/${courseId}/submit`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (response.ok && result.success) {
      setCourses((previousCourses) =>
        previousCourses.map((course) =>
          course._id === courseId
            ? { ...course, status: "pending" }
            : course
        )
      );

      alert("Course submitted for approval successfully!");
    } else {
      alert(result.message || "Unable to submit course.");
    }
  } catch (error) {
    console.error("Submit course error:", error);
    alert("Unable to connect to the server.");
  }
};



const handleDeleteCourse = async (courseId) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this course? This action cannot be undone."
  );

  if (!confirmDelete) return;

  try {
    const response = await fetch(
      `http://localhost:5000/api/courses/${courseId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (response.ok && result.success) {
      setCourses((previousCourses) =>
        previousCourses.filter((course) => course._id !== courseId)
      );

      alert("Course deleted successfully!");
    } else {
      alert(result.message || "Unable to delete course.");
    }
  } catch (error) {
    console.error("Delete course error:", error);
    alert("Unable to connect to the server.");
  }
};

const handleEditCourse = (course) => {
  setEditingCourse({
    ...course,
    price: String(course.price),
  });
};


const handleUpdateCourse = async () => {
  if (!editingCourse.title.trim()) {
    alert("Please enter the course title.");
    return;
  }
  
  if (!editingCourse.category.trim()) {
    alert("Please enter the course category.");
    return;
  }
  
  if (!editingCourse.description.trim()) {
    alert("Please enter the course description.");
    return;
  }
  
  if (editingCourse.price === "" || Number(editingCourse.price) < 0) {
    alert("Please enter a valid course price.");
    return;
  }
  try {
    const response = await fetch(
      `http://localhost:5000/api/courses/${editingCourse._id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editingCourse.title,
          category: editingCourse.category,
          description: editingCourse.description,
          level: editingCourse.level,
          price: Number(editingCourse.price),
        }),
      }
    );

    const result = await response.json();

    if (response.ok && result.success) {
      setCourses((previousCourses) =>
        previousCourses.map((course) =>
          course._id === editingCourse._id
            ? { ...course, ...editingCourse, price: Number(editingCourse.price) }
            : course
        )
      );

      setEditingCourse(null);
      alert("Course updated successfully!");
    } else {
      alert(result.message || "Unable to update course.");
    }
  } catch (error) {
    console.error("Update course error:", error);
    alert("Unable to connect to the server.");
  }
};


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
        {editingCourse && (
        <div className="edit-course-form">
          <h3>Edit Course</h3>

          <div className="form-group">
            <label>Course Title</label>
            <input
              type="text"
              required
              value={editingCourse.title}
              onChange={(e) =>
                setEditingCourse({
                  ...editingCourse,
                  title: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <input
              type="text"
              required
              value={editingCourse.category}
              onChange={(e) =>
                setEditingCourse({
                  ...editingCourse,
                  category: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
            required
              value={editingCourse.description}
              onChange={(e) =>
                setEditingCourse({
                  ...editingCourse,
                  description: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Difficulty Level</label>
            <select
            required
              value={editingCourse.level}
              onChange={(e) =>
                setEditingCourse({
                  ...editingCourse,
                  level: e.target.value,
                })
              }
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="form-group">
            <label>Price (₹)</label>
            <input
              type="number"
              required
              min="0"
              value={editingCourse.price}
              onChange={(e) =>
                setEditingCourse({
                  ...editingCourse,
                  price: e.target.value,
                })
              }
            />
          </div>

          <div className="edit-course-actions">
          <button
            type="button"
            onClick={handleUpdateCourse}
          >
            Save Changes
          </button>

            <button
              type="button"
              onClick={() => setEditingCourse(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
                  <button
                    type="button"
                    onClick={() => handleEditCourse(course)}
                  >
                    Edit
                  </button>
                    <button
                      type="button"
                      className="delete-course-btn"
                      onClick={() => handleDeleteCourse(course._id)}
                    >
                      Delete
                    </button>

                    {course.status === "draft" && (
                      <button
                        type="button"
                        className="submit-course-btn"
                        onClick={() => handleSubmitForApproval(course._id)}
                      >
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
