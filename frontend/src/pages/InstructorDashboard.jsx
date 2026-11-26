import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./InstructorDashboard.css";
import InstructorCourses from "./InstructorCourses";
import CreateCourse from "./CreateCourse";
import CurriculumBuilder from "./CurriculumBuilder";
import Students from "./Students";
import InstructorAnalytics from "./InstructorAnalytics";
import InstructorSettings from "./InstructorSettings";
import InstructorQuizzes from "./InstructorQuizzes";
import InstructorAssignments from "./InstructorAssignments";

function InstructorDashboard() {
  const { token } = useAuth();
const [analytics, setAnalytics] = useState(null);

useEffect(() => {
  let ignore = false;

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/instructor/analytics",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success && !ignore) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch instructor analytics:", error);
    }
  };

  if (token) {
    fetchAnalytics();
  }

  return () => {
    ignore = true;
  };
}, [token]);
  const [activeTab, setActiveTab] = useState("Overview");

  const menuItems = [
    "Overview",
    "My Courses",
    "Create Course",
    "Curriculum Builder",
    "Quiz Management",
    "Assignment Management",
    "Students",
    "Analytics",
    "Settings",
  ];

  return (
    <div className="instructor-dashboard">

      {/* Sidebar */}
      <aside className="instructor-sidebar">

        <div className="instructor-brand">
          <h2>LearnSphere</h2>
          <p>Instructor Panel</p>
        </div>

        <nav className="instructor-menu">
          {menuItems.map((item) => (
            <button
              key={item}
              className={activeTab === item ? "active" : ""}
              onClick={() => setActiveTab(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="instructor-sidebar-footer">
          <p>LearnSphere © 2026</p>
        </div>

      </aside>

      {/* Main Content */}
      <main className="instructor-main">

        <header className="instructor-topbar">
          <div>
            <h1>{activeTab}</h1>
            <p>Manage your teaching activities</p>
          </div>

          <div className="instructor-profile">
            <div className="instructor-avatar">I</div>
            <span>Instructor</span>
          </div>
        </header>

        {activeTab === "Overview" && (
          <section className="instructor-overview">

            <div className="instructor-welcome">
              <h2>Welcome to LearnSphere!</h2>
              <p>Manage your courses and share your knowledge with students.</p>
            </div>

            <div className="instructor-stats">

              <div className="instructor-stat-card">
                <span>Total Courses</span>
                <h2>{analytics ? analytics.totalCourses : "..."}</h2>
              </div>

              <div className="instructor-stat-card">
                <span>Total Students</span>
                <h2>{analytics ? analytics.totalStudents : "..."}</h2>
              </div>

              <div className="instructor-stat-card">
                <span>Published Courses</span>
                <h2>{analytics ? analytics.publishedCourses : "..."}</h2>
              </div>

              <div className="instructor-stat-card">
                <span>Pending Approval</span>
                <h2>{analytics ? analytics.pendingCourses : "..."}</h2>
              </div>

            </div>

            <div className="instructor-quick-actions">
              <h2>Quick Actions</h2>

              <button onClick={() => setActiveTab("Create Course")}>
                + Create New Course
              </button>

              <button onClick={() => setActiveTab("My Courses")}>
                View My Courses
              </button>
            </div>

          </section>
        )}

{activeTab === "My Courses" && (
  <InstructorCourses
    onCreateCourse={() => setActiveTab("Create Course")}
  />
)}
          {activeTab === "Create Course" && <CreateCourse />}
          {activeTab === "Curriculum Builder" && <CurriculumBuilder />}
          {activeTab === "Quiz Management" && <InstructorQuizzes />}
          {activeTab === "Assignment Management" && <InstructorAssignments />}
          {activeTab === "Students" && <Students />}
          {activeTab === "Analytics" && <InstructorAnalytics />}
          {activeTab === "Settings" && <InstructorSettings />}

      </main>
    </div>
  );
}

export default InstructorDashboard;