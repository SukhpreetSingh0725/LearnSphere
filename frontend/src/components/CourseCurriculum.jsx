
import { useEffect, useState } from "react";
import "./CourseCurriculum.css";

function CourseCurriculum({ courseId }) {
  const [curriculum, setCurriculum] = useState([]);
  const [expandedSections, setExpandedSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCurriculum = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5000/api/courses/${courseId}/curriculum`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to load curriculum");
        }

        const sections = result.data || [];

        setCurriculum(sections);

        if (sections.length > 0) {
          setExpandedSections([sections[0]._id]);
        }
      } catch (err) {
        setError(err.message || "Unable to load curriculum");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCurriculum();
    }
  }, [courseId]);

  const totalLessons = curriculum.reduce(
    (total, section) => total + section.lessons.length,
    0
  );

  const toggleSection = (id) => {
    setExpandedSections((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return "";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <section className="curriculum-section">
        <h2>Course Curriculum</h2>
        <p>Loading course curriculum...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="curriculum-section">
        <h2>Course Curriculum</h2>
        <p>{error}</p>
      </section>
    );
  }

  return (
    <section className="curriculum-section">
      <div className="curriculum-heading">
        <div>
          <h2>Course Curriculum</h2>
          <p>Explore the lessons included in this course.</p>
        </div>

        <div className="curriculum-stats">
          <span>{curriculum.length} Sections</span>
          <span>{totalLessons} Lessons</span>
        </div>
      </div>

      {curriculum.length === 0 ? (
        <p>No curriculum has been added to this course yet.</p>
      ) : (
        <div className="curriculum-list">
          {curriculum.map((section) => {
            const isExpanded = expandedSections.includes(section._id);

            return (
              <div className="curriculum-item" key={section._id}>
                <button
                  type="button"
                  className="curriculum-section-button"
                  onClick={() => toggleSection(section._id)}
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${section.title}`}
                >
                  <span className="curriculum-section-title">
                    {section.title}
                  </span>

                  <span className="curriculum-section-meta">
                    {section.lessons.length} lessons
                    <span>{isExpanded ? "−" : "+"}</span>
                  </span>
                </button>

                {isExpanded && (
                  <div className="curriculum-lessons">
                    {section.lessons.map((lesson) => (
                      <div className="curriculum-lesson" key={lesson._id}>
                        <div className="lesson-info">
                          <span className="lesson-icon">
                            {lesson.isPreview ? "▶" : "🔒"}
                          </span>

                          <span>{lesson.title}</span>
                        </div>

                        <div className="lesson-meta">
                          {lesson.isPreview && (
                            <span className="preview-label">Preview</span>
                          )}

                          {formatDuration(lesson.durationSec) && (
                            <span>
                              {formatDuration(lesson.durationSec)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default CourseCurriculum;
