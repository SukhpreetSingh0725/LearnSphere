import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./InstructorAssignments.css";

function InstructorAssignments() {
    const { token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

    const [courses, setCourses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [selectedLesson, setSelectedLesson] = useState("");

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [instructions, setInstructions] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [maxMarks, setMaxMarks] = useState(100);
    const [maxFileSizeMB, setMaxFileSizeMB] = useState(10);

    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [assignmentStudents, setAssignmentStudents] = useState([]);
    const [assignmentStats, setAssignmentStats] = useState(null);
    const [studentSearch, setStudentSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [gradingSubmission, setGradingSubmission] = useState(null);
    const [marksObtained, setMarksObtained] = useState("");
    const [gradingFeedback, setGradingFeedback] = useState("");
    const [gradingStatus, setGradingStatus] = useState("graded");
    const [savingGrade, setSavingGrade] = useState(false);
    const [activePage, setActivePage] = useState("create");
    const [viewingAssignment, setViewingAssignment] = useState(null);
    const [viewingStudent, setViewingStudent] = useState(null);
    // Your Assignments filters
    const [managementCourse, setManagementCourse] = useState("");
    const [managementSection, setManagementSection] = useState("");
    const [managementSections, setManagementSections] = useState([]);

    // Student Submissions filters
    const [submissionCourse, setSubmissionCourse] = useState("");
    const [submissionSection, setSubmissionSection] = useState("");
    const [submissionAssignmentId, setSubmissionAssignmentId] = useState("");
    const [submissionSections, setSubmissionSections] = useState([]);
    const [showSubmissionResults, setShowSubmissionResults] = useState(false);

    const headers = {
        Authorization: `Bearer ${token}`
    };

    const fetchData = async () => {
        try {

            const [courseResponse, assignmentResponse] = await Promise.all([
                fetch(`${API_URL}/api/courses/my-courses`, { headers }),
                fetch(`${API_URL}/api/assignments/instructor`, { headers })
            ]);

            const courseData = await courseResponse.json();
            const assignmentData = await assignmentResponse.json();

            if (!courseResponse.ok) {
                throw new Error(courseData.message || "Unable to load courses");
            }

            if (!assignmentResponse.ok) {
                throw new Error(assignmentData.message || "Unable to load assignments");
            }

            setCourses(courseData.data || []);
            setAssignments(assignmentData.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    useEffect(() => {
        const fetchSections = async () => {
            if (!selectedCourse) {
                return;
            }

            try {
                setError("");

                const response = await fetch(
                    `${API_URL}/api/courses/${selectedCourse}/sections`,
                    { headers }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Unable to load lessons");
                }

                setSections(data.data || []);
                setSelectedLesson("");
            } catch (err) {
                setError(err.message);
                setSections([]);
            }
        };

        if (token) fetchSections();
    }, [selectedCourse, token]);

    const assignmentLessons = sections.flatMap((section) =>
        (section.lessons || [])
            .filter((lesson) => lesson.type === "assignment")
            .map((lesson) => ({
                ...lesson,
                sectionTitle: section.title
            }))
    );

    const fetchFilterSections = async (courseId, setSectionList) => {
        if (!courseId) {
            setSectionList([]);
            return;
        }
    
        try {
            const response = await fetch(
                `${API_URL}/api/courses/${courseId}/sections`,
                { headers }
            );
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.message || "Unable to load sections");
            }
    
            setSectionList(data.data || []);
        } catch (err) {
            setError(err.message);
            setSectionList([]);
        }
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();

        if (!selectedLesson) {
            setError("Please select an assignment lesson");
            return;
        }

        try {
            setCreating(true);
            setError("");
            setMessage("");

            const response = await fetch(`${API_URL}/api/assignments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    lessonId: selectedLesson,
                    title,
                    description,
                    instructions,
                    dueDate: dueDate || null,
                    maxMarks: Number(maxMarks),
                    maxFileSizeMB: Number(maxFileSizeMB)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create assignment");
            }

            setTitle("");
            setDescription("");
            setInstructions("");
            setDueDate("");
            setMaxMarks(100);
            setMaxFileSizeMB(10);
            setSelectedLesson("");

            setMessage("Assignment created successfully!");
            await fetchData();
        } catch (err) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleTogglePublish = async (assignmentId) => {
        try {
            setError("");
            setMessage("");
    
            const response = await fetch(
                `${API_URL}/api/assignments/${assignmentId}/publish`,
                {
                    method: "PATCH",
                    headers
                }
            );
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.message || "Unable to update assignment");
            }
    
            setMessage(data.message);
            await fetchData();
        } catch (err) {
            setError(err.message);
        }
    };


    const handleViewSubmissions = async (assignment) => {
        try {
            setLoadingSubmissions(true);
            setError("");
            setSelectedAssignment(assignment);
            setActivePage("submissions");
            setShowSubmissionResults(true);
            setViewingStudent(null);
    
            const response = await fetch(
                `${API_URL}/api/assignments/${assignment._id}/submissions`,
                { headers }
            );
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.message || "Unable to load submissions");
            }
    
            setAssignmentStudents(data.students || []);
            setAssignmentStats(data.stats || null);
            setStudentSearch("");
            setStatusFilter("all");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingSubmissions(false);
        }
    };

    const handleGradeSubmission = async (submissionId) => {
        try {
            setSavingGrade(true);
            setError("");
            setMessage("");
    
            const response = await fetch(
                `${API_URL}/api/assignments/submissions/${submissionId}/grade`,
                {
                    method: "PATCH",
                    headers: {
                        ...headers,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        marksObtained: Number(marksObtained),
                        feedback: gradingFeedback,
                        status: gradingStatus
                    })
                }
            );
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.message || "Unable to grade submission");
            }
    
            setMessage(data.message);
            setGradingSubmission(null);
            setMarksObtained("");
            setGradingFeedback("");
            setGradingStatus("graded");
    
            await handleViewSubmissions(selectedAssignment);
        } catch (err) {
            setError(err.message);
        } finally {
            setSavingGrade(false);
        }
    };

    const handleDownloadFile = async (submissionId) => {
        try {
            setError("");
    
            const response = await fetch(
                `${API_URL}/api/assignments/submissions/${submissionId}/file`,
                { headers }
            );
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.message || "Unable to download file");
            }
    
            window.open(data.data.url, "_blank", "noopener,noreferrer");
    
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return <p>Loading assignments...</p>;
    }

    const filteredAssignmentStudents = assignmentStudents.filter((item) => {
        const studentName = item.student?.name?.toLowerCase() || "";
        const studentEmail = item.student?.email?.toLowerCase() || "";
        const search = studentSearch.toLowerCase();
    
        const matchesSearch =
            studentName.includes(search) ||
            studentEmail.includes(search);
    
        const submissionStatus = item.submission?.status || "not_submitted";
    
        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "pending" && submissionStatus === "submitted") ||
            submissionStatus === statusFilter;
    
        return matchesSearch && matchesStatus;
    });

    const filteredManagementAssignments = assignments.filter((assignment) => {
        const matchesCourse =
            !managementCourse ||
            assignment.course?._id === managementCourse;
    
        const matchesSection =
            !managementSection ||
            assignment.lesson?.section?._id === managementSection;
    
        return matchesCourse && matchesSection;
    });
    
    const filteredSubmissionAssignments = assignments.filter((assignment) => {
        const matchesCourse =
            !submissionCourse ||
            assignment.course?._id === submissionCourse;
    
        const matchesSection =
            !submissionSection ||
            assignment.lesson?.section?._id === submissionSection;
    
        return matchesCourse && matchesSection;
    });

    return (
        <div className="instructor-assignments">
            <h2>Assignment Management</h2>

            {error && <p>{error}</p>}
                    {message && <p>{message}</p>}

                    <div className="assignment-navigation">
                        <button
                            type="button"
                            className={`assignment-nav-btn ${activePage === "create" ? "active" : ""}`}
                            onClick={() => {
                                setActivePage("create");
                                setViewingAssignment(null);
                                setViewingStudent(null);
                            }}
                        >
                            Create Assignment
                        </button>

                        <button
                            type="button"
                            className={`assignment-nav-btn ${activePage === "assignments" ? "active" : ""}`}
                            onClick={() => {
                                setActivePage("assignments");
                                setViewingAssignment(null);
                                setViewingStudent(null);
                            }}
                        >
                            Your Assignments
                        </button>

                        <button
                            type="button"
                            className={`assignment-nav-btn ${activePage === "submissions" ? "active" : ""}`}
                            onClick={() => {
                                setActivePage("submissions");
                                setViewingAssignment(null);
                                setViewingStudent(null);
                            }}
                        >
                            Student Submissions
                        </button>
                    </div>
                    {activePage === "create" && (
                    <>
                        <h3>Create Assignment</h3>
                        <form className="assignment-form" onSubmit={handleCreateAssignment}>
                <div>
                    <label>Select Course</label>
                    <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        required
                    >
                        <option value="">Choose a course</option>
                        {courses.map((course) => (
                            <option key={course._id} value={course._id}>
                                {course.title}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Select Assignment Lesson</label>
                    <select
                        value={selectedLesson}
                        onChange={(e) => setSelectedLesson(e.target.value)}
                        required
                        disabled={!selectedCourse}
                    >
                        <option value="">Choose a lesson</option>
                        {assignmentLessons.map((lesson) => (
                            <option key={lesson._id} value={lesson._id}>
                                {lesson.sectionTitle} - {lesson.title}
                            </option>
                        ))}
                    </select>

                    {selectedCourse && assignmentLessons.length === 0 && (
                        <p>No assignment lessons found. Create one in Curriculum Builder first.</p>
                    )}
                </div>

                <div>
                    <label>Assignment Title</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter assignment title"
                        required
                    />
                </div>

                <div>
                    <label>Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the assignment"
                        required
                    />
                </div>

                <div>
                    <label>Instructions</label>
                    <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Explain what students need to do"
                    />
                </div>

                <div>
                    <label>Due Date</label>
                    <input
                        type="datetime-local"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />
                </div>

                <div>
                    <label>Maximum Marks</label>
                    <input
                        type="number"
                        min="1"
                        value={maxMarks}
                        onChange={(e) => setMaxMarks(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label>Maximum File Size (MB)</label>
                    <input
                        type="number"
                        min="1"
                        max="50"
                        value={maxFileSizeMB}
                        onChange={(e) => setMaxFileSizeMB(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={creating || !assignmentLessons.length}
                >
                    {creating ? "Creating..." : "Create Assignment"}
                </button>
            </form>
            <hr />
            </>
        )}

                {activePage === "assignments" && (
                    <>
                        <hr />
                        <div className="assignment-list-section">
                            <h3>Your Assignments ({filteredManagementAssignments.length})</h3>

                            <div className="assignment-filters">
                                <div>
                                    <label>Filter by Course</label>
                                    <select
                                        value={managementCourse}
                                        onChange={(e) => {
                                            const courseId = e.target.value;
                                            setManagementCourse(courseId);
                                            setManagementSection("");
                                            fetchFilterSections(courseId, setManagementSections);
                                            setViewingAssignment(null);
                                        }}
                                    >
                                        <option value="">All Courses</option>
                                        {courses.map((course) => (
                                            <option key={course._id} value={course._id}>
                                                {course.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label>Filter by Section</label>
                                    <select
                                        value={managementSection}
                                        onChange={(e) => {
                                            setManagementSection(e.target.value);
                                            setViewingAssignment(null);
                                        }}
                                        disabled={!managementCourse}
                                    >
                                        <option value="">All Sections</option>
                                        {managementSections.map((section) => (
                                            <option key={section._id} value={section._id}>
                                                {section.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                    {!viewingAssignment && (
                    filteredManagementAssignments.length === 0 ? (
                        <p>No assignments found for the selected filters.</p>
                    ) : (
                        <table className="assignment-table">
                            <thead>
                                <tr>
                                    <th>Assignment Name</th>
                                    <th>Published Date</th>
                                    <th>Due Date</th>
                                    <th>Maximum Marks</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredManagementAssignments.map((assignment) => (
                                    <tr key={assignment._id}>
                                        <td>
                                            <button
                                                type="button"
                                                onClick={() => setViewingAssignment(assignment)}
                                            >
                                                {assignment.title}
                                            </button>
                                        </td>

                                        <td>
                                            {assignment.publishedAt
                                                ? new Date(assignment.publishedAt).toLocaleDateString()
                                                : "Not recorded"}
                                        </td>

                                        <td>
                                            {assignment.dueDate
                                                ? new Date(assignment.dueDate).toLocaleDateString()
                                                : "No deadline"}
                                        </td>

                                        <td>{assignment.maxMarks}</td>

                                        <td>
                                            {assignment.isPublished ? "Published" : "Draft"}
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                onClick={() => handleTogglePublish(assignment._id)}
                                            >
                                                {assignment.isPublished ? "Unpublish" : "Publish"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                    )}

                        {viewingAssignment && (
                         <div className="assignment-details">
                                <button
                                    type="button"
                                    className="assignment-back-btn"
                                    onClick={() => setViewingAssignment(null)}
                                >
                                    Back to Assignments
                                </button>

                                <h3 className="assignment-details-title">
                                    {viewingAssignment.title}
                                </h3>

                                <p className="assignment-detail-item">
                                    Course: {viewingAssignment.course?.title}
                                </p>

                                <p className="assignment-detail-item">
                                    Section: {viewingAssignment.lesson?.section?.title || "Not available"}
                                </p>

                                <p className="assignment-detail-item">
                                    Lesson: {viewingAssignment.lesson?.title}
                                </p>

                                <p className="assignment-detail-item">
                                    Description: {viewingAssignment.description}
                                </p>

                                <p className="assignment-detail-item">
                                    Instructions: {viewingAssignment.instructions || "No instructions"}
                                </p>

                                <p className="assignment-detail-item">
                                    Due Date: {viewingAssignment.dueDate
                                        ? new Date(viewingAssignment.dueDate).toLocaleString()
                                        : "No deadline"}
                                </p>

                                <p className="assignment-detail-item">Maximum Marks: {viewingAssignment.maxMarks}</p>

                                <p className="assignment-detail-item">Maximum File Size: {viewingAssignment.maxFileSizeMB} MB</p>

                                <p className="assignment-detail-item">
                                    Allowed File Types: {viewingAssignment.allowedFileTypes?.join(", ")}
                                </p>

                                <p className="assignment-detail-item">
                                    Status: {viewingAssignment.isPublished ? "Published" : "Draft"}
                                </p>

                                <button
                                    type="button"
                                    className="assignment-publish-btn"
                                    onClick={() => handleTogglePublish(viewingAssignment._id)}
                                >
                                    {viewingAssignment.isPublished ? "Unpublish" : "Publish"}
                                </button>
                            </div>
                        )}
                    </>
                )}
                {activePage === "submissions" && !viewingStudent && (
                    <div className="assignment-submissions-section">
                        <hr />
                        <h3>Student Submissions</h3>

                        <div className="submission-filter-item">
                            <label>Filter by Course</label>
                            <select
                                value={submissionCourse}
                                onChange={(e) => {
                                    const courseId = e.target.value;

                                    setSubmissionCourse(courseId);
                                    setSubmissionSection("");
                                    setSubmissionAssignmentId("");
                                    setSelectedAssignment(null);
                                    setAssignmentStudents([]);
                                    setAssignmentStats(null);

                                    fetchFilterSections(courseId, setSubmissionSections);
                                }}
                            >
                                <option value="">Choose a course</option>
                                {courses.map((course) => (
                                    <option key={course._id} value={course._id}>
                                        {course.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="submission-filter-item">
                            <label>Filter by Section</label>
                            <select
                                value={submissionSection}
                                onChange={(e) => {
                                    setSubmissionSection(e.target.value);
                                    setSubmissionAssignmentId("");
                                    setSelectedAssignment(null);
                                    setAssignmentStudents([]);
                                    setAssignmentStats(null);
                                }}
                                disabled={!submissionCourse}
                            >
                                <option value="">Choose a section</option>
                                {submissionSections.map((section) => (
                                    <option key={section._id} value={section._id}>
                                        {section.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="submission-filter-item">
                            <label>Select Assignment</label>
                            <select
                                value={submissionAssignmentId}
                                disabled={!submissionSection}
                                onChange={(e) => {
                                    const assignmentId = e.target.value;
                                    setSubmissionAssignmentId(assignmentId);

                                    const assignment = filteredSubmissionAssignments.find(
                                        (item) => item._id === assignmentId
                                    );

                                    if (assignment) {
                                        handleViewSubmissions(assignment);
                                    } else {
                                        setSelectedAssignment(null);
                                        setAssignmentStudents([]);
                                        setAssignmentStats(null);
                                    }
                                }}
                            >
                                <option value="">Choose an assignment</option>
                                {filteredSubmissionAssignments.map((assignment) => (
                                    <option key={assignment._id} value={assignment._id}>
                                        {assignment.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    {selectedAssignment && !showSubmissionResults && (
                    <button
                        type="button"
                        onClick={() => handleViewSubmissions(selectedAssignment)}
                    >
                        View Submissions
                    </button>
                )}
                    </div>
                )}

{activePage === "submissions" && showSubmissionResults && selectedAssignment && (
                   <div className="submission-results-section">
                        {!viewingStudent && (
                            <>
                        <hr />
                        <h3>Submissions: {selectedAssignment.title}</h3>

                        {assignmentStats && (
                            <div>
                                <h4>Assignment Overview</h4>

                                <div className="assignment-stats-grid">
                                
                                    {[
                                        {
                                            label: "Total Students",
                                            value: assignmentStats.totalStudents
                                        },
                                        {
                                            label: "Submitted",
                                            value: assignmentStats.submitted
                                        },
                                        {
                                            label: "Graded",
                                            value: assignmentStats.graded
                                        },
                                        {
                                            label: "Pending Grading",
                                            value: assignmentStats.pendingGrading
                                        },
                                        {
                                            label: "Not Submitted",
                                            value: assignmentStats.notSubmitted
                                        },
                                        {
                                            label: "Revision Requested",
                                            value: assignmentStats.revisionRequested
                                        }
                                    ].map((stat) => (
                                        <div className="assignment-stat-card" key={stat.label}>
                                            <p>{stat.label}</p>
                                            <h3>{stat.value ?? 0}</h3>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <hr />

                        <h4>Student Submissions</h4>

                        <input
                            type="text"
                            className="submission-search"
                            placeholder="Search student by name or email"
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                        />

                        <select
                            value={statusFilter}
                            className="submission-status-filter"
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Students</option>
                            <option value="submitted">Submitted</option>
                            <option value="graded">Graded</option>
                            <option value="pending">Pending Grading</option>
                            <option value="not_submitted">Not Submitted</option>
                            <option value="revision_requested">Revision Requested</option>
                        </select>

                        <button
                            type="button"
                            className="close-submissions-btn"
                            onClick={() => {
                                setShowSubmissionResults(false);
                                setViewingStudent(null);
                                setGradingSubmission(null);
                            }}
                        >
                            Close Submissions
                        </button>
                        </>
                        )}
                        {viewingStudent ? (
        <div className="student-submission-details">
        <button
            type="button"
              className="back-to-student-list"
            onClick={() => {
                setViewingStudent(null);
                setGradingSubmission(null);
            }}
        >
            Back to Student List
        </button>

        <hr />

        <h3>Student Submission Details</h3>

        <h4>{viewingStudent.student?.name}</h4>
        <p>Email: {viewingStudent.student?.email}</p>

        {!viewingStudent.submission ? (
            <p>Status: Not Submitted</p>
        ) : (
            <>
                <p>Status: {viewingStudent.submission.status}</p>

                <p>
                    Submitted: {new Date(
                        viewingStudent.submission.submittedAt
                    ).toLocaleString()}
                </p>

                <p>
                    Late: {viewingStudent.submission.isLate ? "Yes" : "No"}
                </p>

                <p>
                    Written Response: {
                        viewingStudent.submission.textResponse || "No written response"
                    }
                </p>

                <p>
                    File: {viewingStudent.submission.fileName || "No file uploaded"}
                </p>

                {viewingStudent.submission.fileUrl && (
                    <button
                        type="button"
                        onClick={() =>
                            handleDownloadFile(viewingStudent.submission._id)
                        }
                    >
                        Download Submission
                    </button>
                )}

                <p>
                    Marks: {viewingStudent.submission.marksObtained ?? "Not graded"}
                </p>

                <p>
                    Feedback: {viewingStudent.submission.feedback || "No feedback yet"}
                </p>

                {gradingSubmission === viewingStudent.submission._id ? (
                    <div className="assignment-grading-form">
                        <h4>Grade Submission</h4>

                        <input
                            type="number"
                            min="0"
                            max={selectedAssignment.maxMarks}
                            placeholder="Marks obtained"
                            value={marksObtained}
                            onChange={(e) => setMarksObtained(e.target.value)}
                        />

                        <textarea
                            placeholder="Feedback for student"
                            value={gradingFeedback}
                            onChange={(e) => setGradingFeedback(e.target.value)}
                        />

                        <select
                            value={gradingStatus}
                            onChange={(e) => setGradingStatus(e.target.value)}
                        >
                            <option value="graded">Grade and approve</option>
                            <option value="revision_requested">Request revision</option>
                        </select>

                        <button
                            type="button"
                            disabled={
                                savingGrade ||
                                marksObtained === "" ||
                                Number(marksObtained) < 0 ||
                                Number(marksObtained) > selectedAssignment.maxMarks
                            }
                            onClick={() =>
                                handleGradeSubmission(viewingStudent.submission._id)
                            }
                        >
                            {savingGrade ? "Saving..." : "Submit Grade"}
                        </button>

                        <button
                            type="button"
                            onClick={() => setGradingSubmission(null)}
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => {
                            setGradingSubmission(viewingStudent.submission._id);
                            setMarksObtained(
                                viewingStudent.submission.marksObtained ?? ""
                            );
                            setGradingFeedback(
                                viewingStudent.submission.feedback || ""
                            );
                            setGradingStatus(
                                viewingStudent.submission.status === "revision_requested"
                                    ? "revision_requested"
                                    : "graded"
                            );
                        }}
                    >
                        Grade / Review
                    </button>
                )}
            </>
        )}
    </div>
) : loadingSubmissions ? (
    <p>Loading submissions...</p>
) : filteredAssignmentStudents.length === 0 ? (
    <p>No students found matching your search or filter.</p>
) : (
    <table className="submission-table">
        <thead>
            <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Submission Status</th>
                <th>Submitted At</th>
                <th>Late</th>
                <th>Action</th>
            </tr>
        </thead>

        <tbody>
            {filteredAssignmentStudents.map((item) => {
                const student = item.student;
                const submission = item.submission;

                return (
                    <tr key={student._id}>
                        <td>
                            <button
                                type="button"
                                onClick={() => setViewingStudent(item)}
                            >
                                {student.name}
                            </button>
                        </td>

                        <td>{student.email}</td>
                        <td>{submission?.status || "Not Submitted"}</td>

                        <td>
                            {submission?.submittedAt
                                ? new Date(submission.submittedAt).toLocaleString()
                                : "-"}
                        </td>

                        <td>
                            {submission
                                ? submission.isLate ? "Yes" : "No"
                                : "-"}
                        </td>

                        <td>
                            <button
                                type="button"
                                onClick={() => setViewingStudent(item)}
                            >
                                View Details
                            </button>
                        </td>
                    </tr>
                );
            })}
        </tbody>
    </table>
)}                     
                    </div>
                )}
        </div>
    );

    
}

export default InstructorAssignments;
