import { useState } from "react";
import "./InstructorDashboard.css";
import InstructorCourses from "./InstructorCourses";
import CreateCourse from "./CreateCourse";
import CurriculumBuilder from "./CurriculumBuilder";

function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");

  const menuItems = [
    "Overview",
    "My Courses",
    "Create Course",
    "Curriculum Builder",
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
                <h2>0</h2>
              </div>

              <div className="instructor-stat-card">
                <span>Total Students</span>
                <h2>0</h2>
              </div>

              <div className="instructor-stat-card">
                <span>Published Courses</span>
                <h2>0</h2>
              </div>

              <div className="instructor-stat-card">
                <span>Pending Approval</span>
                <h2>0</h2>
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

          {activeTab === "My Courses" && <InstructorCourses />}
          {activeTab === "Create Course" && <CreateCourse />}
          {activeTab === "Curriculum Builder" && <CurriculumBuilder />}

          {activeTab !== "Overview" && activeTab !== "My Courses" &&  activeTab !== "Create Course" && activeTab !== "Curriculum Builder" &&(
            <section className="instructor-placeholder">
              <h2>{activeTab}</h2>
              <p>This section will be developed next.</p>
            </section>
          )}

      </main>
    </div>
  );
}

export default InstructorDashboard;