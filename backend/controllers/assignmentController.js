const Assignment = require("../models/Assignment");
const AssignmentSubmission = require("../models/AssignmentSubmission");
const Course = require("../models/Course");
const Section = require("../models/Section");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");
const { supabase } = require("../config/storage");
const Progress = require("../models/Progress");


// Create Assignment
const createAssignment = async (req, res) => {
    try {
        const {
            lessonId,
            title,
            description,
            instructions,
            dueDate,
            maxMarks,
            allowedFileTypes,
            maxFileSizeMB
        } = req.body;

        if (!lessonId || !title?.trim() || !description?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Lesson, title and description are required"
            });
        }

        const lesson = await Lesson.findById(lessonId);

        if (!lesson || lesson.type !== "assignment") {
            return res.status(404).json({
                success: false,
                message: "Assignment lesson not found"
            });
        }

        const section = await Section.findById(lesson.section);
        const course = section && await Course.findById(section.course);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        if (
            course.instructor.toString() !== req.user._id.toString() &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to create this assignment"
            });
        }

        const existingAssignment = await Assignment.findOne({
            lesson: lessonId
        });

        if (existingAssignment) {
            return res.status(409).json({
                success: false,
                message: "An assignment already exists for this lesson"
            });
        }

        if (dueDate && Number.isNaN(new Date(dueDate).getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid due date"
            });
        }

        const assignment = await Assignment.create({
            course: course._id,
            lesson: lesson._id,
            instructor: course.instructor,
            title: title.trim(),
            description: description.trim(),
            instructions,
            dueDate: dueDate || null,
            maxMarks: maxMarks ?? 100,
            allowedFileTypes,
            maxFileSizeMB
        });

        return res.status(201).json({
            success: true,
            message: "Assignment created successfully",
            data: assignment
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Instructor Assignments
const getInstructorAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find({
            instructor: req.user._id
        })
        .populate("course", "title")
        .populate({
            path: "lesson",
            select: "title section",
            populate: {
                path: "section",
                select: "title"
            }
        })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: assignments.length,
            data: assignments
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Update Assignment
const updateAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const {
            title,
            description,
            instructions,
            dueDate,
            maxMarks,
            allowedFileTypes,
            maxFileSizeMB
        } = req.body;

        const assignment = await Assignment.findById(assignmentId);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        if (
            assignment.instructor.toString() !== req.user._id.toString() &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to edit this assignment"
            });
        }

        if (title !== undefined && !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Assignment title is required"
            });
        }

        if (description !== undefined && !description.trim()) {
            return res.status(400).json({
                success: false,
                message: "Assignment description is required"
            });
        }

        if (
            dueDate !== undefined &&
            dueDate !== null &&
            dueDate !== "" &&
            Number.isNaN(new Date(dueDate).getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid due date"
            });
        }

        if (
            maxMarks !== undefined &&
            (!Number.isFinite(Number(maxMarks)) || Number(maxMarks) < 1)
        ) {
            return res.status(400).json({
                success: false,
                message: "Maximum marks must be at least 1"
            });
        }

        if (
            maxFileSizeMB !== undefined &&
            (
                !Number.isFinite(Number(maxFileSizeMB)) ||
                Number(maxFileSizeMB) < 1 ||
                Number(maxFileSizeMB) > 50
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "File size must be between 1 and 50 MB"
            });
        }

        if (
            allowedFileTypes !== undefined &&
            (
                !Array.isArray(allowedFileTypes) ||
                allowedFileTypes.length === 0 ||
                allowedFileTypes.some(
                    type => typeof type !== "string" || !type.trim()
                )
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Select at least one valid file type"
            });
        }

        if (maxMarks !== undefined) {
            const newMaxMarks = Number(maxMarks);

            const existingGradedSubmission = await AssignmentSubmission.findOne({
                assignment: assignmentId,
                status: "graded",
                marksObtained: { $gt: newMaxMarks }
            });

            if (existingGradedSubmission) {
                return res.status(400).json({
                    success: false,
                    message: "Maximum marks cannot be lower than marks already awarded"
                });
            }

            assignment.maxMarks = newMaxMarks;
        }

        if (title !== undefined) assignment.title = title.trim();
        if (description !== undefined) assignment.description = description.trim();
        if (instructions !== undefined) assignment.instructions = instructions;
        if (dueDate !== undefined) assignment.dueDate = dueDate || null;

        if (allowedFileTypes !== undefined) {
            assignment.allowedFileTypes = allowedFileTypes.map(
                type => type.trim().toLowerCase()
            );
        }

        if (maxFileSizeMB !== undefined) {
            assignment.maxFileSizeMB = Number(maxFileSizeMB);
        }

        await assignment.save();

        return res.status(200).json({
            success: true,
            message: "Assignment updated successfully",
            data: assignment
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Toggle Assignment Publishing
const toggleAssignmentPublish = async (req, res) => {
    try {
        const assignment = await Assignment.findOne({
            _id: req.params.assignmentId,
            instructor: req.user._id
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        assignment.isPublished = !assignment.isPublished;

        assignment.publishedAt = assignment.isPublished
            ? new Date()
            : null;
        
        await assignment.save();

        return res.status(200).json({
            success: true,
            message: assignment.isPublished
                ? "Assignment published successfully"
                : "Assignment unpublished successfully",
            data: assignment
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Student Assignments for a Course
const getStudentAssignments = async (req, res) => {
    try {
        const { courseId } = req.params;

        const enrollment = await Enrollment.findOne({
            student: req.user._id,
            course: courseId,
            status: { $in: ["active", "completed"] }
        });

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: "You must be enrolled in this course"
            });
        }

        const assignments = await Assignment.find({
            course: courseId,
            isPublished: true
        })
            .populate("lesson", "title")
            .sort({ createdAt: 1 })
            .lean();

        const data = await Promise.all(
            assignments.map(async (assignment) => {
                const submission = await AssignmentSubmission.findOne({
                    assignment: assignment._id,
                    student: req.user._id
                });

                return {
                    ...assignment,
                    submission
                };
            })
        );

        return res.status(200).json({
            success: true,
            count: data.length,
            data
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Submit Assignment
const submitAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { textResponse, fileKey, fileName } = req.body;

        const assignment = await Assignment.findOne({
            _id: assignmentId,
            isPublished: true
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found or not published"
            });
        }

        const enrollment = await Enrollment.findOne({
            student: req.user._id,
            course: assignment.course,
            status: { $in: ["active", "completed"] }
        });

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: "You must be enrolled to submit this assignment"
            });
        }

        if ((!textResponse || !textResponse.trim()) && !fileKey) {
            return res.status(400).json({
                success: false,
                message: "Provide a written response or upload a file"
            });
        }

        let verifiedFileName = "";

        if (fileKey) {
            const folder = `${assignment.course}/${assignment._id}/${req.user._id}`;
            const prefix = `${folder}/`;

            if (
                !fileKey.startsWith(prefix) ||
                fileKey.split("/").length !== 4
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid assignment file path"
                });
            }

            const uploadedFileName = fileKey.split("/").pop();
            const extension = uploadedFileName.split(".").pop().toLowerCase();

            const allowedTypes = assignment.allowedFileTypes || [
                "pdf", "doc", "docx", "zip"
            ];

            if (!allowedTypes.includes(extension)) {
                return res.status(400).json({
                    success: false,
                    message: "This file type is not allowed"
                });
            }

            const { data: files, error } = await supabase.storage
                .from("assignments")
                .list(folder, {
                    search: uploadedFileName,
                    limit: 100
                });

            if (error) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to verify uploaded file"
                });
            }

            const uploadedFile = files?.find(
                file => file.name === uploadedFileName
            );

            if (!uploadedFile) {
                return res.status(400).json({
                    success: false,
                    message: "Uploaded file could not be found"
                });
            }

            const maxSize = assignment.maxFileSizeMB * 1024 * 1024;

            if (
                !uploadedFile.metadata?.size ||
                uploadedFile.metadata.size > maxSize
            ) {
                return res.status(400).json({
                    success: false,
                    message: `File must be ${assignment.maxFileSizeMB} MB or smaller`
                });
            }

            verifiedFileName = uploadedFileName;
        }

        const existingSubmission = await AssignmentSubmission.findOne({
            assignment: assignmentId,
            student: req.user._id
        });

        if (existingSubmission?.status === "graded") {
            return res.status(409).json({
                success: false,
                message: "This assignment has already been graded"
            });
        }

        const isLate = assignment.dueDate
            ? new Date() > assignment.dueDate
            : false;

        const submission = await AssignmentSubmission.findOneAndUpdate(
            {
                assignment: assignmentId,
                student: req.user._id
            },
            {
                $set: {
                    textResponse: textResponse?.trim() || "",
                    fileUrl: fileKey || "",
                    fileName: verifiedFileName,
                    submittedAt: new Date(),
                    status: "submitted",
                    marksObtained: null,
                    feedback: "",
                    gradedAt: null,
                    gradedBy: null,
                    isLate
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        return res.status(200).json({
            success: true,
            message: "Assignment submitted successfully",
            data: submission
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Get Submissions for an Assignment
const getAssignmentSubmissions = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const assignment = await Assignment.findOne({
            _id: assignmentId,
            instructor: req.user._id
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        const enrollments = await Enrollment.find({
            course: assignment.course,
            status: { $in: ["active", "completed"] }
        }).populate("student", "name email profileImage");
        
        const submissions = await AssignmentSubmission.find({
            assignment: assignmentId
        })
            .populate("student", "name email profileImage")
            .sort({ submittedAt: -1 });
        
        const submissionMap = new Map(
            submissions.map((submission) => [
                submission.student._id.toString(),
                submission
            ])
        );
        
        const students = enrollments
            .filter((enrollment) => enrollment.student)
            .map((enrollment) => ({
                student: enrollment.student,
                submission: submissionMap.get(
                    enrollment.student._id.toString()
                ) || null
            }));

            const totalStudents = students.length;

            const submittedCount = students.filter(
                (item) => item.submission
            ).length;

            const gradedCount = students.filter(
                (item) => item.submission?.status === "graded"
            ).length;

            const pendingGradingCount = students.filter(
                (item) => item.submission?.status === "submitted"
            ).length;

            const notSubmittedCount = students.filter(
                (item) => !item.submission
            ).length;

            const revisionRequestedCount = students.filter(
                (item) => item.submission?.status === "revision_requested"
            ).length;

        return res.status(200).json({
            success: true,
            count: submissions.length,
            data: submissions,
            students,
            stats: {
                totalStudents,
                submitted: submittedCount,
                graded: gradedCount,
                pendingGrading: pendingGradingCount,
                notSubmitted: notSubmittedCount,
                revisionRequested: revisionRequestedCount
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Generate Secure Assignment File Download URL
const getAssignmentFileUrl = async (req, res) => {
    try {
        const { submissionId } = req.params;

        const submission = await AssignmentSubmission.findById(submissionId)
            .populate("assignment");

        if (!submission || !submission.fileUrl) {
            return res.status(404).json({
                success: false,
                message: "Assignment file not found"
            });
        }

        const assignment = submission.assignment;

        const isInstructor =
            assignment.instructor.toString() === req.user._id.toString();

        const isStudent =
            submission.student.toString() === req.user._id.toString();

        if (!isInstructor && !isStudent && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this file"
            });
        }

        const { data, error } = await supabase.storage
            .from("assignments")
            .createSignedUrl(submission.fileUrl, 60);

        if (error || !data?.signedUrl) {
            return res.status(500).json({
                success: false,
                message: "Unable to generate file download URL"
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                url: data.signedUrl,
                fileName: submission.fileName
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Grade Assignment Submission
const gradeAssignmentSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { marksObtained, feedback, status } = req.body;

        if (
            !["graded", "revision_requested"].includes(status) ||
            !Number.isFinite(marksObtained) ||
            marksObtained < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid marks and submission status are required"
            });
        }

        const submission = await AssignmentSubmission.findById(submissionId)
            .populate("assignment");

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found"
            });
        }

        const assignment = submission.assignment;

        if (
            assignment.instructor.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to grade this submission"
            });
        }

        if (marksObtained > assignment.maxMarks) {
            return res.status(400).json({
                success: false,
                message: `Marks cannot exceed ${assignment.maxMarks}`
            });
        }

        submission.marksObtained = marksObtained;
        submission.feedback = feedback?.trim() || "";
        submission.status = status;
        submission.gradedAt = new Date();
        submission.gradedBy = req.user._id;

        await submission.save();

        if (status === "graded") {
            const lesson = await Lesson.findById(assignment.lesson);
        
            if (lesson) {
                const progress = await Progress.findOneAndUpdate(
                    {
                        student: submission.student,
                        course: assignment.course
                    },
                    {
                        $addToSet: {
                            completedLessons: lesson._id
                        }
                    },
                    {
                        upsert: true,
                        new: true,
                        setDefaultsOnInsert: true
                    }
                );
        
                const sectionIds = await Section.distinct("_id", {
                    course: assignment.course
                });
        
                const totalLessons = await Lesson.countDocuments({
                    section: { $in: sectionIds }
                });
        
                if (
                    totalLessons > 0 &&
                    progress.completedLessons.length >= totalLessons
                ) {
                    progress.completedAt = new Date();
                    await progress.save();
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: "Submission graded successfully",
            data: submission
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    createAssignment,
    updateAssignment,
    getInstructorAssignments,
    toggleAssignmentPublish,
    getStudentAssignments,
    submitAssignment,
    getAssignmentSubmissions,
    getAssignmentFileUrl,
    gradeAssignmentSubmission
};