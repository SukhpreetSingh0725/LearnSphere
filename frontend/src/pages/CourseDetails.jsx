import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./CourseDetails.css";

function CourseDetails() {
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5000/api/courses/${id}`
        );

        if (!response.ok) {
          throw new Error("Course not found");
        }

        const result = await response.json();

        // Supports both {data: course} and direct course responses
        const courseData = result.data || result.course || result;

        setCourse(courseData);
      } catch (err) {
        setError(err.message || "Unable to load course.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  if (loading) {
    return (
      <div className="course-details-message">
        <div className="course-loader"></div>
        <p>Loading course details...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
        <div className="course-details-message">
        <div className="error-icon">!</div>

        <h2>Unable to Load Course</h2>

        <p>
            {error || "This course may have been removed or is unavailable."}
        </p>

        <Link to="/" className="back-home-btn">
            Explore Other Courses
        </Link>
        </div>
    );
}

  const instructor =
    typeof course.instructor === "object"
      ? course.instructor?.name
      : course.instructor;

  return (
    <div className="course-details-page">
      <div className="course-details-container">

        <Link to="/" className="back-home-link">
          ← Back to Courses
        </Link>

        <div className="course-details-header">

          <div className="course-details-info">

            <span className="course-category">
              {course.category || "General"}
            </span>

            <h1>{course.title}</h1>

            <p className="course-description">
              {course.description || "Explore this course and start learning today."}
            </p>

            <div className="course-meta">
              <span>⭐ {course.rating || 0} Rating</span>
              <span>📚 {course.level || "Beginner"}</span>
              <span>👨‍🏫 {instructor || "LearnSphere Instructor"}</span>
            </div>

            <div className="course-price-section">
              <h2>
                {Number(course.price) === 0
                  ? "Free"
                  : `₹${course.price}`}
              </h2>
              <span>One-time course price</span>
            </div>

            <button
              className="enroll-btn"
              onClick={() => alert("Enrollment and payment will be available soon!")}
            >
              Enroll Now
            </button>

            <p className="course-access-note">
              Start your learning journey with LearnSphere.
            </p>

          </div>

          <div className="course-details-image">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
              />
            ) : (
              <div className="course-image-placeholder">
                <span>📖</span>
                <p>Course Preview</p>
              </div>
            )}
          </div>

        </div>

        <section className="course-overview">
            <h2>About This Course</h2>
            <p>
                {course.description ||
                "This course is designed to help you learn new skills and improve your knowledge."}
            </p>

            <div className="course-overview-details">
                <div>
                <span>📚</span>
                <div>
                    <strong>Course Level</strong>
                    <p>{course.level || "Beginner"}</p>
                </div>
                </div>

                <div>
                <span>📂</span>
                <div>
                    <strong>Category</strong>
                    <p>{course.category || "General"}</p>
                </div>
                </div>

                <div>
                <span>⭐</span>
                <div>
                    <strong>Course Rating</strong>
                    <p>{course.rating || 0} / 5</p>
                </div>
                </div>
            </div>

            <h3>Why Learn This Course?</h3>

            <ul className="course-benefits">
                <li>Learn through structured course content.</li>
                <li>Study at your own pace.</li>
                <li>Track your learning progress.</li>
                <li>Access course lessons after enrollment.</li>
            </ul>
        </section>

        <section className="instructor-profile">
            <h2>Meet Your Instructor</h2>

            <div className="instructor-card">
                <div className="instructor-avatar">
                {instructor
                    ? instructor.charAt(0).toUpperCase()
                    : "I"}
                </div>

                <div className="instructor-details">
                <h3>{instructor || "LearnSphere Instructor"}</h3>
                <p>Course Instructor</p>
                <span>Learn and grow with LearnSphere.</span>
                </div>
            </div>
        </section>

        <section className="course-features">
          <h2>What You Will Get</h2>

          <div className="course-features-grid">
            <div className="course-feature">
              <span>🎥</span>
              <h3>Video Lessons</h3>
              <p>Learn through structured video lessons.</p>
            </div>

            <div className="course-feature">
              <span>📝</span>
              <h3>Learning Notes</h3>
              <p>Keep track of your learning and important points.</p>
            </div>

            <div className="course-feature">
              <span>📈</span>
              <h3>Track Progress</h3>
              <p>Monitor your learning progress.</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default CourseDetails;