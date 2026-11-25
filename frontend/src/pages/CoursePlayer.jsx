import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


const parseTranscript = (transcript = "") => {
  return transcript
    .split("\n")
    .map((line, index) => {
      const trimmedLine = line.trim();

      const match = trimmedLine.match(
        /^(\d{2}):([0-5]\d):([0-5]\d(?:\.\d{1,3})?)\s+(.+)$/
      );

      if (!match) return null;

      const [, hours, minutes, seconds, text] = match;

      return {
        id: index,
        time:
          Number(hours) * 3600 +
          Number(minutes) * 60 +
          Number(seconds),
        timestamp: `${hours}:${minutes}:${seconds}`,
        text,
      };
    })
    .filter(Boolean);
};

function CoursePlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const videoRef = useRef(null);
  const resumeAtRef = useRef(0);
  const autoCompletedRef = useRef(new Set());
  const shouldAutoPlayRef = useRef(false);
  const [stream, setStream] = useState({ lessonId: null, url: "" });
  const [streamError, setStreamError] = useState("");
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [resumePosition, setResumePosition] = useState(0);
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [speed, setSpeed] = useState(1);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [progress, setProgress] = useState({
    totalLessons: 0,
    completedLessons: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [downloadingResource, setDownloadingResource] = useState("");

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const [
          curriculumResponse,
          progressResponse,
          faqResponse
        ] = await Promise.all([
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

          fetch(`${API}/api/courses/${courseId}/faqs`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          })
        ]);

        const curriculumData = await curriculumResponse.json();
        const progressData = await progressResponse.json();
        const faqData = await faqResponse.json();

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
        setFaqs(faqData.success ? faqData.data : []);
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
        setResumePosition(
          resumeLesson ? progressInfo.lastPosition || 0 : 0
        );

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

  // Ask the API for a short-lived signed URL whenever the lesson changes.
  const fetchStreamUrl = useCallback(async (lessonId) => {
    try {
      const res = await fetch(`${API}/api/lessons/${lessonId}/stream-url`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Unable to load video");
      setStreamError("");
      setStream({ lessonId, url: body.data.url });
    } catch (err) {
      setStream({ lessonId: null, url: "" });
      setStreamError(err.message);
    }
  }, [API, token]);

  useEffect(() => {
    resumeAtRef.current = 0;
    if (!activeLesson?.hasVideo || !token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStreamUrl(activeLesson._id);
  }, [activeLesson?._id, activeLesson?.hasVideo, token, fetchStreamUrl]);

  // Signed URLs expire (about 5 minutes). If playback fails after that,
  // get a fresh URL and continue from the same position.
  const handleVideoError = () => {
    if (!activeLesson) return;
    resumeAtRef.current = videoRef.current?.currentTime || 0;
    fetchStreamUrl(activeLesson._id);
  };

  // Flat list of lessons for Previous / Next navigation
  const lessonList = sections.flatMap((section) => section.lessons);
  const activeIndex = lessonList.findIndex(
    (lesson) => lesson._id === activeLesson?._id
  );
  const prevLesson = activeIndex > 0 ? lessonList[activeIndex - 1] : null;
  const nextLesson =
    activeIndex >= 0 && activeIndex < lessonList.length - 1
      ? lessonList[activeIndex + 1]
      : null;
        // Only use a URL that belongs to the lesson currently shown
  const streamUrl =
  stream.lessonId === activeLesson?._id ? stream.url : "";

  // Marks the current lesson complete (never un-completes)
  const markCurrentComplete = async () => {
    if (!activeLesson || completedLessonIds.includes(activeLesson._id)) return;
    const lessonId = activeLesson._id;

    try {
      const response = await fetch(
        `${API}/api/progress/${courseId}/lessons/${lessonId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ completed: true }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      const updated = data.data;
      setProgress({
        totalLessons: updated.totalLessons,
        completedLessons: updated.completedLessons,
        percentage: updated.percentage,
      });
      setCompletedLessonIds((prev) =>
        prev.includes(lessonId) ? prev : [...prev, lessonId]
      );
    } catch (err) {
      console.error("Auto-complete failed:", err.message);
      autoCompletedRef.current.delete(lessonId);
    }
  };

  const handleSpeedChange = (e) => {
    const value = Number(e.target.value);
    setSpeed(value);
    if (videoRef.current) videoRef.current.playbackRate = value;
  };

  const handleSelectLesson = async (lesson) => {
    setActiveLesson(lesson);
    setCurrentTime(0);
    setResumePosition(0);
    setTranscriptSearch("");
    lastSavedPositionRef.current = 0;

    try {
      await fetch(
        `${API}/api/progress/${courseId}/lessons/${lesson._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            lastPosition: 0,
          }),
        }
      );
    } catch (err) {
      console.error("Unable to save last lesson:", err.message);
    }
  };

  const handleVideoEnded = () => {
    if (autoPlayNext && nextLesson) {
      shouldAutoPlayRef.current = true;
      handleSelectLesson(nextLesson);
    }
  };

  const handleTranscriptClick = (time) => {
    if (!videoRef.current) return;

    videoRef.current.currentTime = time;
    videoRef.current.play();
  };

  const lastSavedPositionRef = useRef(0);

const savePlaybackPosition = async (lessonId, position) => {
  if (!lessonId || !token) return;

  try {
    await fetch(
      `${API}/api/progress/${courseId}/lessons/${lessonId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lastPosition: position,
        }),
      }
    );
  } catch (err) {
    console.error("Unable to save playback position:", err.message);
  }
};

const handleVideoTimeUpdate = (e) => {
  const video = e.currentTarget;
  const time = video.currentTime;

  setCurrentTime(time);

  if (!activeLesson) return;

  localStorage.setItem(
    `learnsphere-${courseId}-${activeLesson._id}`,
    time.toString()
  );

  if (time - lastSavedPositionRef.current >= 10) {
    lastSavedPositionRef.current = time;
    savePlaybackPosition(activeLesson._id, time);
  }

  if (
    video.duration > 0 &&
    time / video.duration >= 0.9 &&
    !autoCompletedRef.current.has(activeLesson._id)
  ) {
    autoCompletedRef.current.add(activeLesson._id);
    markCurrentComplete();
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

  const transcriptLines = parseTranscript(
    activeLesson?.transcript || ""
  );

  const filteredTranscriptLines = transcriptLines.filter((line) =>
    line.text.toLowerCase().includes(transcriptSearch.toLowerCase())
  );

  const activeTranscriptIndex = transcriptLines.reduce(
    (activeIdx, line, index) => {
      return line.time <= currentTime ? index : activeIdx;
    },
    -1
  );
  const handleResourceDownload = async (resource) => {
    try {
      setDownloadingResource(resource.url);

      const response = await fetch(
       `${API}/api/lessons/${activeLesson._id}/resource-url?key=${encodeURIComponent(resource.url)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to download resource");
      }

      window.open(data.data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      alert(error.message);
    } finally {
      setDownloadingResource("");
    }
  };

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

          {activeLesson?.hasVideo ? (
            <video
              key={activeLesson._id}
              ref={videoRef}
              src={streamUrl || undefined}
              onError={handleVideoError}
              onEnded={handleVideoEnded}
              onLoadedMetadata={() => {
                const video = videoRef.current;
                if (!video) return;

                video.playbackRate = speed;

                // Autoplay when arriving from "next lesson"
                if (shouldAutoPlayRef.current) {
                  shouldAutoPlayRef.current = false;
                  video.play().catch(() => {});
                }

                // After a URL refresh, continue from where playback stopped
                if (resumeAtRef.current > 0) {
                  video.currentTime = resumeAtRef.current;
                  video.play().catch(() => {});
                  resumeAtRef.current = 0;
                  return;
                }

              // Resume from the position saved in MongoDB
                if (resumePosition > 0 && resumePosition < video.duration - 2) {
                  video.currentTime = resumePosition;
                  return;
                }

                // Fallback to the browser's locally saved position
                const savedTime = localStorage.getItem(
                  `learnsphere-${courseId}-${activeLesson._id}`
                );

                if (savedTime && Number(savedTime) < video.duration - 2) {
                  video.currentTime = Number(savedTime);
                }
              }}
              controls
              controlsList="nodownload"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
              onTimeUpdate={handleVideoTimeUpdate}
              onPause={(e) => {
                const position = e.currentTarget.currentTime;

                if (activeLesson) {
                  lastSavedPositionRef.current = position;
                  savePlaybackPosition(activeLesson._id, position);
                }
              }}
              style={{ width: "100%", background: "#000" }}
            >
              {activeLesson.subtitleUrl && (
                <track
                  kind="subtitles"
                  src={activeLesson.subtitleUrl}
                  srcLang="en"
                  label="English"
                  default
                />
              )}
            </video>
          ) : (
            <p>Select a lesson with a video to start learning.</p>
          )}

          {streamError && <p style={{ color: "#dc2626" }}>{streamError}</p>}

          {activeLesson && (
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                flexWrap: "wrap",
                marginTop: "12px",
              }}
            >
              <button
                disabled={!prevLesson}
                onClick={() => prevLesson && handleSelectLesson(prevLesson)}
              >
                ← Previous
              </button>

              <button
                disabled={!nextLesson}
                onClick={() => nextLesson && handleSelectLesson(nextLesson)}
              >
                Next →
              </button>

              <label>
                Speed{" "}
                <select value={speed} onChange={handleSpeedChange}>
                  {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                    <option key={rate} value={rate}>
                      {rate}x
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={autoPlayNext}
                  onChange={(e) => setAutoPlayNext(e.target.checked)}
                />{" "}
                Autoplay next
              </label>
            </div>
          )}

          {activeLesson?.transcript && (
            <div
              style={{
                marginTop: "20px",
                padding: "20px",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
              }}
            >
              <h3>Lesson Transcript</h3>

              <input
                type="text"
                placeholder="Search transcript..."
                value={transcriptSearch}
                onChange={(e) => setTranscriptSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  boxSizing: "border-box",
                }}
              />

              {filteredTranscriptLines.length === 0 ? (
                <p>No matching transcript lines found.</p>
              ) : (
                filteredTranscriptLines.map((line) => (
                  <div
                    key={line.id}
                    style={{
                      display: "flex",
                      gap: "12px",
                      padding: "10px",
                      marginBottom: "5px",
                      background:
                        transcriptLines[activeTranscriptIndex]?.id === line.id
                          ? "#dbeafe"
                          : "#f8fafc",
                      borderRadius: "6px",
                    }}
                  >
                    <button
                      onClick={() => handleTranscriptClick(line.time)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#2563eb",
                        fontWeight: "bold",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {line.timestamp}
                    </button>

                    <span>{line.text}</span>
                  </div>
                ))
              )}
            </div>
          )}

{activeLesson?.resources?.length > 0 && (
  <div
    style={{
      marginTop: "20px",
      padding: "20px",
      border: "1px solid #e2e8f0",
      borderRadius: "10px",
    }}
  >
    <h3>Lesson Resources</h3>

    {activeLesson.resources.map((resource, index) => (
      <div key={index} style={{ marginBottom: "10px" }}>
        <button
          type="button"
          onClick={() => handleResourceDownload(resource)}
          disabled={downloadingResource === resource.url}
        >
          {downloadingResource === resource.url
            ? "Preparing download..."
            : `Download ${resource.title || "Resource"}`}
        </button>

        <small> ({resource.type})</small>
      </div>
    ))}
  </div>
)}

            {course.instructor && (
              <div
                style={{
                  marginTop: "25px",
                  padding: "20px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                }}
              >
                <h3>About the Instructor</h3>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    marginTop: "15px",
                  }}
                >
                  <img
                    src={course.instructor.profileImage || "https://placehold.co/80x80"}
                    alt={course.instructor.name}
                    style={{
                      width: "65px",
                      height: "65px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />

                  <div>
                    <h3>{course.instructor.name}</h3>
                    <p>{course.instructor.bio}</p>
                  </div>
                </div>
              </div>
            )}

          <div style={{
            marginTop: "25px",
            padding: "20px",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px"
          }}>
            <h3>Frequently Asked Questions</h3>

            {faqs.length === 0 ? (
              <p style={{ color: "#64748b" }}>
                No FAQs available yet.
              </p>
            ) : (
              faqs.map((faq) => (
                <div
                  key={faq._id}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    padding: "12px 0"
                  }}
                >
                  <button
                    onClick={() =>
                      setOpenFAQ(openFAQ === faq._id ? null : faq._id)
                    }
                    style={{
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      textAlign: "left",
                      cursor: "pointer",
                      fontWeight: "600",
                      padding: "8px 0"
                    }}
                  >
                    {openFAQ === faq._id ? "−" : "+"} {faq.question}
                  </button>

                  {openFAQ === faq._id && (
                    <p style={{ marginTop: "8px", color: "#475569" }}>
                      {faq.answer}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {activeLesson && activeLesson.type !== "quiz" && (
            <button
              onClick={handleCompleteLesson}
              disabled={saving}
              style={{
                marginTop: "15px",
                padding: "12px 20px",
                background: isActiveLessonCompleted ? "#64748b" : "#16a34a",
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
                    onClick={() => {
                      if (lesson.type === "quiz") {
                        if (lesson.quiz?._id) {
                          navigate(`/learn/${courseId}/quiz/${lesson.quiz._id}`);
                        } else {
                          alert("This quiz is not published yet.");
                        }
                        return;
                      }
                      if (lesson.type === "assignment") {
                        navigate(`/learn/${courseId}/assignments/${lesson._id}`);
                        return;
                      }

                      handleSelectLesson(lesson);
                    }}
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