import { useState } from "react";
import "./CourseCurriculum.css";

const curriculum = [
  {
    id: 1,
    title: "Section 1: Introduction",
    lessons: [
      { id: 1, title: "Welcome to the Course", duration: "05:20", preview: true },
      { id: 2, title: "Course Overview", duration: "08:15", preview: true },
      { id: 3, title: "Learning Requirements", duration: "06:30", preview: false },
    ],
  },
  {
    id: 2,
    title: "Section 2: Fundamentals",
    lessons: [
      { id: 4, title: "Understanding the Basics", duration: "12:40", preview: true },
      { id: 5, title: "Important Concepts", duration: "15:10", preview: false },
      { id: 6, title: "Practical Examples", duration: "10:25", preview: false },
    ],
  },
  {
    id: 3,
    title: "Section 3: Advanced Learning",
    lessons: [
      { id: 7, title: "Advanced Topics", duration: "18:30", preview: false },
      { id: 8, title: "Real World Applications", duration: "14:20", preview: false },
    ],
  },
];

function CourseCurriculum() {
  const [expandedSections, setExpandedSections] = useState([1]);

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

      <div className="curriculum-list">
        {curriculum.map((section) => {
          const isExpanded = expandedSections.includes(section.id);

          return (
            <div className="curriculum-item" key={section.id}>
              <button
                className="curriculum-section-button"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isExpanded}
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
                    <div className="curriculum-lesson" key={lesson.id}>
                      <div className="lesson-info">
                        <span className="lesson-icon">
                          {lesson.preview ? "▶" : "🔒"}
                        </span>

                        <span>{lesson.title}</span>
                      </div>

                      <div className="lesson-meta">
                        {lesson.preview && (
                          <span className="preview-label">Preview</span>
                        )}
                        <span>{lesson.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="curriculum-note">
        This is a sample curriculum preview. Actual lessons will be loaded
        from the course API in a future integration.
      </p>
    </section>
  );
}

export default CourseCurriculum;