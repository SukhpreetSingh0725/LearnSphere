import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function CoursePlayer() {
  const { courseId } = useParams();
  const { token } = useAuth();

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [progress, setProgress] = useState({
    totalLessons: 0,
    completedLessons: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const [curriculumResponse, progressResponse] = await Promise.all([
          fetch(`${API}/api/courses/${courseId}/learn`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }),

          fetch(`${API}/api/progress/${courseId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }),
        ]);

        const curriculumData = await curriculumResponse.json();
        const progressData = await progressResponse.json();

        if (!curriculumResponse.ok) {
          throw new Error(
            curriculumData.message || "Unable to load course"
          );
        }

        if (!progressResponse.ok) {
          throw new Error(
            progressData.message || "Unable to load progress"
          );
        }

        const courseSections = curriculumData.data.data || [];
        const progressInfo = progressData.data;

        setCourse(curriculumData.data.course);
        setSections(courseSections);
        setCompletedLessonIds(
          progressInfo.completedLessonIds || []
        );

        setProgress({
          totalLessons: progressInfo.totalLessons,
          completedLessons: progressInfo.completedLessons,
          percentage: progressInfo.percentage,
        });

        const allLessons = courseSections.flatMap(
          (section) => section.lessons
        );

        const lastLessonId = progressInfo.lastLesson?._id;

        const resumeLesson = allLessons.find(
          (lesson) => lesson._id === lastLessonId
        );

        const firstVideoLesson = allLessons.find(
          (lesson) => lesson.type === "video"
        );

        setActiveLesson(resumeLesson || firstVideoLesson || null);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCourseData();
    }
  }, [courseId, token]);

  const handleSelectLesson = async (lesson) => {
    setActiveLesson(lesson);

    try {
      await fetch(
        `${API}/api/progress/${courseId}/lessons/${lesson._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );
    } catch (err) {
      console.error("Unable to save last lesson:", err.message);
    }
  };

  const handleCompleteLesson = async () => {
    if (!activeLesson || saving) return;

    const isCompleted = completedLessonIds.includes(activeLesson._id);

    setSaving(true);

    try {
      const response = await fetch(
        `${API}/api/progress/${courseId}/lessons/${activeLesson._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            completed: !isCompleted,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update progress");
      }

      const updated = data.data;

      setProgress({
        totalLessons: updated.totalLessons,
        completedLessons: updated.completedLessons,
        percentage: updated.percentage,
      });

      setCompletedLessonIds((prev) =>
        isCompleted
          ? prev.filter((id) => id !== activeLesson._id)
          : [...prev, activeLesson._id]
      );

    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading course...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!course) {
    return <p>Course not found.</p>;
  }

  const isActiveLessonCompleted =
    activeLesson &&
    completedLessonIds.includes(activeLesson._id);

  return (
    <div style={{ padding: "25px" }}>
      <h1>{course.title}</h1>
      <p>{course.description}</p>

      <div style={{ marginTop: "25px", marginBottom: "25px" }}>
        <h3>
          Course Progress: {progress.percentage}%
        </h3>

        <p>
          {progress.completedLessons} of {progress.totalLessons} lessons completed
        </p>

        <div
          style={{
            width: "100%",
            height: "12px",
            background: "#e5e7eb",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress.percentage}%`,
              height: "100%",
              background: "#16a34a",
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "25px", marginTop: "25px" }}>
        <div style={{ flex: 3 }}>
          <h2>{activeLesson?.title || "Select a lesson"}</h2>

          {activeLesson?.videoKey ? (
            <video
              key={activeLesson._id}
              src={activeLesson.videoKey}
              controls
              controlsList="nodownload"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
              style={{ width: "100%", background: "#000" }}
            />
          ) : (
            <p>Select a lesson with a video to start learning.</p>
          )}

          {activeLesson && (
            <button
              onClick={handleCompleteLesson}
              disabled={saving}
              style={{
                marginTop: "15px",
                padding: "12px 20px",
                background: isActiveLessonCompleted
                  ? "#64748b"
                  : "#16a34a",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving
                ? "Saving..."
                : isActiveLessonCompleted
                ? "✓ Completed - Undo"
                : "Mark as Completed"}
            </button>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <h2>Course Content</h2>

          {sections.map((section) => (
            <div key={section._id}>
              <h3>{section.title}</h3>

              {section.lessons.map((lesson) => {
                const isCompleted = completedLessonIds.includes(
                  lesson._id
                );

                return (
                  <button
                    key={lesson._id}
                    onClick={() => handleSelectLesson(lesson)}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "12px",
                      marginBottom: "8px",
                      cursor: "pointer",
                      background:
                        activeLesson?._id === lesson._id
                          ? "#dbeafe"
                          : "#f3f4f6",
                      border: "1px solid #ddd",
                      textAlign: "left",
                    }}
                  >
                    {isCompleted ? "✓" : "▶"} {lesson.title}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CoursePlayer;
