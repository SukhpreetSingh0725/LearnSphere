import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  uploadLessonVideo,
  uploadLessonResource,
} from "../utils/uploadVideo";
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
  const [lessonVideoInputs, setLessonVideoInputs] = useState({});
  const [editedLessonVideo, setEditedLessonVideo] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [editedLessonSubtitle, setEditedLessonSubtitle] = useState("");
  const [editedLessonTranscript, setEditedLessonTranscript] = useState("");
  const [faqs, setFaqs] = useState([]);
  const [currentFAQPage, setCurrentFAQPage] = useState(1);
  const faqsPerPage = 2;
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [editedFAQQuestion, setEditedFAQQuestion] = useState("");
  const [editedFAQAnswer, setEditedFAQAnswer] = useState("");
  const [savingFAQ, setSavingFAQ] = useState(false);
  const [showFAQForm, setShowFAQForm] = useState(false);
  const [lessonResources, setLessonResources] = useState([]);
  const [editedLessonResources, setEditedLessonResources] = useState([]);
  const [uploadingResourceIndex, setUploadingResourceIndex] = useState(null);
  const [lessonTypeInputs, setLessonTypeInputs] = useState({});
const [lessonOrderInputs, setLessonOrderInputs] = useState({});
  const handleAddResource = (isEditing = false) => {
  const newResource = { title: "", url: "", type: "other" };
  
    if (isEditing) {
      setEditedLessonResources((prev) => [...prev, newResource]);
    } else {
      setLessonResources((prev) => [...prev, newResource]);
    }
  };
  
  const handleResourceChange = (isEditing, index, field, value) => {
    const setter = isEditing ? setEditedLessonResources : setLessonResources;
  
    setter((prev) =>
      prev.map((resource, i) =>
        i === index ? { ...resource, [field]: value } : resource
      )
    );
  };
  
  const handleRemoveResource = (isEditing, index) => {
    const setter = isEditing ? setEditedLessonResources : setLessonResources;
  
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResourceFileChange = async (index, file, lessonId) => {
    if (!file) return;
  
    try {
      setUploadingResourceIndex(index);
  
      const key = await uploadLessonResource({
        file,
        lessonId,
        token,
      });
  
      setEditedLessonResources((prev) =>
        prev.map((resource, i) =>
          i === index
            ? {
                ...resource,
                title: file.name,
                url: key,
                type: file.type === "application/pdf" ? "pdf" : "document",
              }
            : resource
        )
      );
  
      alert("Resource uploaded successfully!");
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingResourceIndex(null);
    }
  };

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
  const fetchFAQs = async (courseId) => {
    try {
        const response = await fetch(
            `http://localhost:5000/api/courses/${courseId}/manage-faqs`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                cache: "no-store"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch FAQs");
        }

        setFaqs(data.data || []);

    } catch (error) {
        setError(error.message);
        setFaqs([]);
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
            type: lessonTypeInputs[sectionId] || "video",
            order: Number(
              lessonOrderInputs[sectionId] ?? sections.find(
                (section) => section._id === sectionId
              )?.lessons?.length ?? 0
            ),
            videoKey: lessonTypeInputs[sectionId] === "quiz"
              ? ""
              : lessonVideoInputs[sectionId] || "",
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
      setLessonVideoInputs((prev) => ({
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

  const handleVideoFileChange = async (e, lessonId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    setUploadMessage("");
    setError("");

    try {
      const key = await uploadLessonVideo({ file, lessonId, token });
      console.log("Uploaded key:", key);
      setEditedLessonVideo(key);
      setUploadMessage("Video uploaded. Click Save to attach it to this lesson.");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingVideo(false);
      e.target.value = "";
    }
  };
  const handleUpdateLesson = async (lessonId) => {
    console.log("Saving lesson with videoKey:", editedLessonVideo);
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
            videoKey: editedLessonVideo,
            subtitleUrl: editedLessonSubtitle,
            transcript: editedLessonTranscript,
            resources: editedLessonResources,
          }),
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to update lesson");
      }
  
      setEditingLesson(null);
      setEditedLessonTitle("");
      setUploadMessage("");
  
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
    setFaqs([]);
    setError("");

    if (courseId) {
        fetchCurriculum(courseId);
        fetchFAQs(courseId);
    }
};

const handleCreateFAQ = async (e) => {
  e.preventDefault();

  if (!faqQuestion.trim() || !faqAnswer.trim()) {
      setError("Please enter both question and answer");
      return;
  }

  try {
      setSavingFAQ(true);
      setError("");

      const response = await fetch(
          `http://localhost:5000/api/courses/${selectedCourse}/faqs`,
          {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                  question: faqQuestion,
                  answer: faqAnswer
              })
          }
      );

      const data = await response.json();

      if (!response.ok) {
          throw new Error(data.message || "Failed to create FAQ");
      }

      setFaqQuestion("");
      setFaqAnswer("");

      await fetchFAQs(selectedCourse);
      setCurrentFAQPage(1);
      setShowFAQForm(false);

  } catch (error) {
      setError(error.message);
  } finally {
      setSavingFAQ(false);
  }
};

const handleUpdateFAQ = async (faqId) => {
  if (!editedFAQQuestion.trim() || !editedFAQAnswer.trim()) {
      setError("Please enter both question and answer");
      return;
  }

  try {
      setSavingFAQ(true);
      setError("");

      const response = await fetch(
          `http://localhost:5000/api/faqs/${faqId}`,
          {
              method: "PUT",
              headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                  question: editedFAQQuestion,
                  answer: editedFAQAnswer
              })
          }
      );

      const data = await response.json();

      if (!response.ok) {
          throw new Error(data.message || "Failed to update FAQ");
      }

      setEditingFAQ(null);
      setEditedFAQQuestion("");
      setEditedFAQAnswer("");

      await fetchFAQs(selectedCourse);

  } catch (error) {
      setError(error.message);
  } finally {
      setSavingFAQ(false);
  }
};

const handleDeleteFAQ = async (faqId) => {
  const confirmed = window.confirm(
      "Are you sure you want to delete this FAQ?"
  );

  if (!confirmed) return;

  try {
      setError("");

      const response = await fetch(
          `http://localhost:5000/api/faqs/${faqId}`,
          {
              method: "DELETE",
              headers: {
                  Authorization: `Bearer ${token}`
              }
          }
      );

      const data = await response.json();

      if (!response.ok) {
          throw new Error(data.message || "Failed to delete FAQ");
      }

      await fetchFAQs(selectedCourse);

  } catch (error) {
      setError(error.message);
  }
};

const totalFAQPages = Math.ceil(faqs.length / faqsPerPage);

const startFAQIndex = (currentFAQPage - 1) * faqsPerPage;

const currentFAQs = faqs.slice(
  startFAQIndex,
  startFAQIndex + faqsPerPage
);

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
           <>
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
                      {lesson.type === "video" && (
    <>
                        <label>
                        Lesson video (MP4, WebM or MOV, up to 50 MB)
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          disabled={uploadingVideo}
                          onChange={(e) => handleVideoFileChange(e, lesson._id)}
                        />
                      </label>
                      {uploadingVideo && <p>Uploading video, please wait...</p>}
                      {uploadMessage && <p>{uploadMessage}</p>}
                      {editedLessonVideo && !uploadMessage && (
                        <p>A video is attached. Choose a file to replace it.</p>
                      )}
                      <input
                        type="text"
                        placeholder="Enter subtitle URL (.vtt)"
                        value={editedLessonSubtitle}
                        onChange={(e) => setEditedLessonSubtitle(e.target.value)}
                      />

                      <textarea
                        placeholder="Enter timestamped transcript (e.g. 00:00:05 Welcome!)"
                        value={editedLessonTranscript}
                        onChange={(e) => setEditedLessonTranscript(e.target.value)}
                        rows={5}
                      />
                     <div>
                        <h4>Lesson Resources</h4>

                        {editedLessonResources.map((resource, index) => (
                          <div key={index}>
                            <input
                              type="text"
                              placeholder="Resource title"
                              value={resource.title}
                              onChange={(e) =>
                                handleResourceChange(true, index, "title", e.target.value)
                              }
                            />

                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.ppt,.pptx"
                              onChange={(e) =>
                                handleResourceFileChange(
                                  index,
                                  e.target.files[0],
                                  lesson._id
                                )
                              }
                            />

                            {uploadingResourceIndex === index && (
                              <p>Uploading resource...</p>
                            )}

                            {resource.url && (
                              <p>Uploaded: {resource.title}</p>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveResource(true, index)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleAddResource(true)}
                        >
                          + Add Resource
                        </button>
                      </div>
                      </>
)}
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
                       <small>
                        {lesson.type}
                        {" · "}
                        {lesson.videoKey ? "✅ Video attached" : "⚠️ No video"}
                      </small>
                    </div>
                  
                    <div className="lesson-actions">
                    <button
                      type="button"
                      className="edit-lesson-btn"
                      onClick={() => {
                        setEditingLesson(lesson._id);
                        setEditedLessonTitle(lesson.title);
                        setEditedLessonVideo(lesson.videoKey || "");
                        setEditedLessonSubtitle(lesson.subtitleUrl || "");
                        setEditedLessonTranscript(lesson.transcript || "");
                        setEditedLessonResources(lesson.resources || []);
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
                  <select
                      value={lessonTypeInputs[section._id] || "video"}
                      onChange={(e) =>
                        setLessonTypeInputs((prev) => ({
                          ...prev,
                          [section._id]: e.target.value,
                        }))
                      }
                    >
                      <option value="video">Video Lesson</option>
                      <option value="quiz">Quiz Lesson</option>
                      <option value="assignment">Assignment Lesson</option>
                    </select>

                    
                    <p>Create the lesson first, then click Edit to upload its video.</p>
              
              
                  <button type="submit" disabled={creatingLesson}>
                    {creatingLesson ? "Adding..." : "Add Lesson"}
                  </button>
                </form>
              </div>
            ))
          )}
              </div>

{/* FAQ Management */}
<div className="course-faq-manager">
  <div className="faq-manager-header">
    <div>
      <h3>Course FAQs</h3>
      <p>Manage frequently asked questions for your students.</p>
    </div>

    <button
      type="button"
      className="faq-add-btn"
      onClick={() => {
        setShowFAQForm(!showFAQForm);
        setEditingFAQ(null);
        setFaqQuestion("");
        setFaqAnswer("");
      }}
    >
      {showFAQForm ? "Cancel" : "+ Add FAQ"}
    </button>
  </div>

  {showFAQForm && (
    <form onSubmit={handleCreateFAQ} className="faq-create-form">
      <h4>Add New FAQ</h4>

      <label>Question</label>
      <input
        type="text"
        placeholder="Enter FAQ question"
        value={faqQuestion}
        onChange={(e) => setFaqQuestion(e.target.value)}
        maxLength={300}
        required
      />

      <label>Answer</label>
      <textarea
        placeholder="Enter FAQ answer"
        value={faqAnswer}
        onChange={(e) => setFaqAnswer(e.target.value)}
        maxLength={2000}
        rows={4}
        required
      />

      <button type="submit" disabled={savingFAQ}>
        {savingFAQ ? "Adding..." : "Save FAQ"}
      </button>
    </form>
  )}

{!showFAQForm && (
  <div className="faq-management-list">
    {faqs.length === 0 ? (
      <p className="faq-empty-message">No FAQs added yet.</p>
    ) : (
      currentFAQs
  .filter((faq) => !editingFAQ || faq._id === editingFAQ)
  .map((faq, index) => (
        <div className="faq-management-item" key={faq._id}>
          {editingFAQ === faq._id ? (
            <div className="faq-edit-form">
              <h4>Edit FAQ</h4>

              <label>Question</label>
              <input
                type="text"
                value={editedFAQQuestion}
                onChange={(e) => setEditedFAQQuestion(e.target.value)}
                maxLength={300}
              />

              <label>Answer</label>
              <textarea
                value={editedFAQAnswer}
                onChange={(e) => setEditedFAQAnswer(e.target.value)}
                maxLength={2000}
                rows={4}
              />

              <div className="faq-item-actions">
                <button
                  type="button"
                  className="faq-save-btn"
                  disabled={savingFAQ}
                  onClick={() => handleUpdateFAQ(faq._id)}
                >
                  {savingFAQ ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="faq-cancel-btn"
                  onClick={() => {
                    setEditingFAQ(null);
                    setEditedFAQQuestion("");
                    setEditedFAQAnswer("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="faq-item-content">
              <span className="faq-number">FAQ {startFAQIndex + index + 1}</span>
                <h4>{faq.question}</h4>
                <p>{faq.answer}</p>
              </div>

              <div className="faq-item-actions">
                <button
                  type="button"
                  className="faq-edit-btn"
                  onClick={() => {
                    setShowFAQForm(false);
                    setEditingFAQ(faq._id);
                    setEditedFAQQuestion(faq.question);
                    setEditedFAQAnswer(faq.answer);
                  }}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="faq-delete-btn"
                  onClick={() => handleDeleteFAQ(faq._id)}
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
          ))
        )}
    
        {totalFAQPages > 1 && !editingFAQ && (
          <div className="faq-pagination">
            <button
              type="button"
              disabled={currentFAQPage === 1}
              onClick={() => setCurrentFAQPage((prev) => prev - 1)}
            >
              Previous
            </button>
    
            <span>
              Page {currentFAQPage} of {totalFAQPages}
            </span>
    
            <button
              type="button"
              disabled={currentFAQPage === totalFAQPages}
              onClick={() => setCurrentFAQPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    )}
    </div>
</>
)}
</div>
);
}

export default CurriculumBuilder;
