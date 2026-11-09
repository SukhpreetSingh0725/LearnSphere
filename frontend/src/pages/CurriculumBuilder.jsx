import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./CurriculumBuilder.css";

function CurriculumBuilder() {
  const { token } = useAuth();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [creatingSection, setCreatingSection] = useState(false);
  const [lessonInputs, setLessonInputs] = useState({});
  const [creatingLesson, setCreatingLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
const [editedLessonTitle, setEditedLessonTitle] = useState("");
const [editingSection, setEditingSection] = useState(null);
const [editedSectionTitle, setEditedSectionTitle] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
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
      }
    };

    if (token) fetchCourses();
  }, [token]);

  const fetchCurriculum = async (courseId) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/courses/${courseId}/sections`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch curriculum");
      }

      setSections(data.data || []);
    } catch (err) {
      setError(err.message);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
  
    if (!newSectionTitle.trim()) {
      setError("Please enter a section title");
      return;
    }
  
    setCreatingSection(true);
    setError("");
  
    try {
      const response = await fetch(
        `http://localhost:5000/api/courses/${selectedCourse}/sections`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: newSectionTitle,
          }),
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to create section");
      }
  
      setNewSectionTitle("");
      await fetchCurriculum(selectedCourse);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingSection(false);
    }
  };

  const handleCreateLesson = async (e, sectionId) => {
    e.preventDefault();
  
    const title = lessonInputs[sectionId] || "";
  
    if (!title.trim()) {
      setError("Please enter a lesson title");
      return;
    }
  
    setCreatingLesson(true);
    setError("");
  
    try {
      const response = await fetch(
        `http://localhost:5000/api/sections/${sectionId}/lessons`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            type: "video",
            durationSec: 0,
            isPreview: false,
          }),
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to create lesson");
      }
  
      setLessonInputs((prev) => ({
        ...prev,
        [sectionId]: "",
      }));
  
      await fetchCurriculum(selectedCourse);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingLesson(false);
    }
  };

  const handleUpdateLesson = async (lessonId) => {
    if (!editedLessonTitle.trim()) {
      setError("Lesson title cannot be empty");
      return;
    }
  
    setError("");
  
    try {
      const response = await fetch(
        `http://localhost:5000/api/lessons/${lessonId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: editedLessonTitle,
          }),
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to update lesson");
      }
  
      setEditingLesson(null);
      setEditedLessonTitle("");
  
      await fetchCurriculum(selectedCourse);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this lesson?"
    );
  
    if (!confirmed) return;
  
    setError("");
  
    try {
      const response = await fetch(
        `http://localhost:5000/api/lessons/${lessonId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete lesson");
      }
  
      await fetchCurriculum(selectedCourse);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateSection = async (sectionId) => {
    if (!editedSectionTitle.trim()) {
      setError("Section title cannot be empty");
      return;
    }
  
    setError("");
  
    try {
      const response = await fetch(
        `http://localhost:5000/api/sections/${sectionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: editedSectionTitle,
          }),
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to update section");
      }
  
      setEditingSection(null);
      setEditedSectionTitle("");
  
      await fetchCurriculum(selectedCourse);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this section? All lessons inside it will also be deleted."
    );
  
    if (!confirmed) return;
  
    setError("");
  
    try {
      const response = await fetch(
        `http://localhost:5000/api/sections/${sectionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete section");
      }
  
      await fetchCurriculum(selectedCourse);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
    setSections([]);

    if (courseId) {
      fetchCurriculum(courseId);
    }
  };

  return (
    <div className="curriculum-builder">
      <h2>Curriculum Builder</h2>
      <p>Organize your course into sections and lessons.</p>

      <div className="curriculum-course-select">
        <label>Select Course</label>

        <select value={selectedCourse} onChange={handleCourseChange}>
          <option value="">Choose a course</option>

          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="curriculum-error">{error}</p>}

      {loading && <p>Loading curriculum...</p>}

      {selectedCourse && !loading && (
        <div className="curriculum-sections">
          <h3>Course Sections</h3>
          <form onSubmit={handleCreateSection} className="add-section-form">
            <input
                type="text"
                placeholder="Enter section title"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                required
            />

            <button type="submit" disabled={creatingSection}>
                {creatingSection ? "Adding..." : "Add Section"}
            </button>
            </form>

          {sections.length === 0 ? (
            <p>No sections added yet.</p>
          ) : (
            sections.map((section) => (
                <div className="curriculum-section" key={section._id}>
                <div className="section-header">
                <div>
                {editingSection === section._id ? (
                  <div className="edit-section-form">
                    <input
                      type="text"
                      value={editedSectionTitle}
                      onChange={(e) => setEditedSectionTitle(e.target.value)}
                    />

                    <button
                      type="button"
                      onClick={() => handleUpdateSection(section._id)}
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingSection(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <h4>{section.title}</h4>
                )}
                  <p>{section.lessons?.length || 0} lessons</p>
                </div>

                <div className="section-actions">
                <button
                  type="button"
                  className="edit-section-btn"
                  onClick={() => {
                    setEditingSection(section._id);
                    setEditedSectionTitle(section.title);
                  }}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="delete-section-btn"
                  onClick={() => handleDeleteSection(section._id)}
                >
                  Delete
                </button>
                </div>
              </div>
              
                <div className="section-lessons">
                  {section.lessons?.map((lesson) => (
                    <div className="curriculum-lesson" key={lesson._id}>
                    <div className="lesson-info">
                    {editingLesson === lesson._id ? (
                    <div className="edit-lesson-form">
                      <input
                        type="text"
                        value={editedLessonTitle}
                        onChange={(e) => setEditedLessonTitle(e.target.value)}
                      />

                      <button
                        type="button"
                        onClick={() => handleUpdateLesson(lesson._id)}
                      >
                        Save
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingLesson(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span>{lesson.title}</span>
                  )}
                      <small>{lesson.type}</small>
                    </div>
                  
                    <div className="lesson-actions">
                    <button
                      type="button"
                      className="edit-lesson-btn"
                      onClick={() => {
                        setEditingLesson(lesson._id);
                        setEditedLessonTitle(lesson.title);
                      }}
                    >
                      Edit
                    </button>
                  
                    <button
                      type="button"
                      className="delete-lesson-btn"
                      onClick={() => handleDeleteLesson(lesson._id)}
                    >
                      Delete
                    </button>
                    </div>
                  </div>
                  ))}
                </div>
              
                <form
                  className="add-lesson-form"
                  onSubmit={(e) => handleCreateLesson(e, section._id)}
                >
                  <input
                    type="text"
                    placeholder="Enter lesson title"
                    value={lessonInputs[section._id] || ""}
                    onChange={(e) =>
                      setLessonInputs((prev) => ({
                        ...prev,
                        [section._id]: e.target.value,
                      }))
                    }
                    required
                  />
              
                  <button type="submit" disabled={creatingLesson}>
                    {creatingLesson ? "Adding..." : "Add Lesson"}
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default CurriculumBuilder;
