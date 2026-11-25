
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { uploadAssignmentFile } from "../utils/uploadVideo";

function StudentAssignments() {
    const { courseId, lessonId } = useParams();
    const { token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [textResponses, setTextResponses] = useState({});
    const [selectedFiles, setSelectedFiles] = useState({});
    const [submitting, setSubmitting] = useState("");

    const headers = {
        Authorization: `Bearer ${token}`
    };

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/assignments/course/${courseId}`,
                { headers }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load assignments");
            }

            const allAssignments = data.data || [];

            const filteredAssignments = lessonId
                ? allAssignments.filter(
                    (assignment) => assignment.lesson?._id === lessonId
                )
                : allAssignments;

            setAssignments(filteredAssignments);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && courseId) {
            fetchAssignments();
        }
    }, [token, courseId, lessonId]);

    const handleSubmit = async (assignment) => {
        try {
            setSubmitting(assignment._id);
            setError("");
            setMessage("");

            const file = selectedFiles[assignment._id];
            let uploadedFile = {};

            if (file) {
                uploadedFile = await uploadAssignmentFile({
                    file,
                    assignmentId: assignment._id,
                    token
                });
            }

            const response = await fetch(
                `${API_URL}/api/assignments/${assignment._id}/submit`,
                {
                    method: "POST",
                    headers: {
                        ...headers,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        textResponse: textResponses[assignment._id] || "",
                        ...uploadedFile
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to submit assignment");
            }

            setMessage("Assignment submitted successfully!");
            setSelectedFiles((previous) => ({
                ...previous,
                [assignment._id]: null
            }));

            await fetchAssignments();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting("");
        }
    };

    if (loading) {
        return <p>Loading assignments...</p>;
    }

    return (
        <div>
            <h2>Course Assignments</h2>

            {error && <p>{error}</p>}
            {message && <p>{message}</p>}

            {assignments.length === 0 ? (
                <p>No published assignments available.</p>
            ) : (
                assignments.map((assignment) => {
                    const submission = assignment.submission;
                    const canSubmit =
                        !submission ||
                        submission.status === "revision_requested";

                    return (
                        <div key={assignment._id}>
                            <hr />
                            <h3>{assignment.title}</h3>
                            <p>{assignment.description}</p>
                            <p>Instructions: {assignment.instructions || "No additional instructions"}</p>
                            <p>Lesson: {assignment.lesson?.title}</p>
                            <p>Maximum Marks: {assignment.maxMarks}</p>
                            <p>
                                Due Date:{" "}
                                {assignment.dueDate
                                    ? new Date(assignment.dueDate).toLocaleString()
                                    : "No due date"}
                            </p>

                            {submission && (
                                <div>
                                    <h4>Your Submission</h4>
                                    <p>Status: {submission.status}</p>
                                    <p>
                                        Submitted:{" "}
                                        {new Date(submission.submittedAt).toLocaleString()}
                                    </p>
                                    <p>Marks: {submission.marksObtained ?? "Not graded"}</p>
                                    <p>Feedback: {submission.feedback || "No feedback yet"}</p>
                                    {submission.fileUrl && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch(
                                                        `${API_URL}/api/assignments/submissions/${submission._id}/file`,
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
                                            }}
                                        >
                                            Download My Submission
                                        </button>
                                    )}
                                </div>
                            )}

                            {canSubmit ? (
                                <div>
                                    <textarea
                                        placeholder="Write your answer here"
                                        value={textResponses[assignment._id] || ""}
                                        onChange={(e) =>
                                            setTextResponses((previous) => ({
                                                ...previous,
                                                [assignment._id]: e.target.value
                                            }))
                                        }
                                    />

                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.zip"
                                        onChange={(e) =>
                                            setSelectedFiles((previous) => ({
                                                ...previous,
                                                [assignment._id]: e.target.files[0] || null
                                            }))
                                        }
                                    />
                                    {selectedFiles[assignment._id] && (
                                        <div>
                                            <p>Selected: {selectedFiles[assignment._id].name}</p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedFiles((previous) => ({
                                                        ...previous,
                                                        [assignment._id]: null
                                                    }));
                                                }}
                                            >
                                                Remove File
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        disabled={submitting === assignment._id}
                                        onClick={() => handleSubmit(assignment)}
                                    >
                                        {submitting === assignment._id
                                            ? "Submitting..."
                                            : submission
                                                ? "Resubmit Assignment"
                                                : "Submit Assignment"}
                                    </button>
                                </div>
                            ) : (
                                <p>Assignment has been graded. Resubmission is not available.</p>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}

export default StudentAssignments;
