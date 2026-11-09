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
                <h4>{section.title}</h4>
              
                <p>{section.lessons?.length || 0} lessons</p>
              
                <div className="section-lessons">
                  {section.lessons?.map((lesson) => (
                    <div className="curriculum-lesson" key={lesson._id}>
                      <span>{lesson.title}</span>
                      <small>{lesson.type}</small>
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
