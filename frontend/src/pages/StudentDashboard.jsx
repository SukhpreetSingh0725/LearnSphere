import { useState } from "react";
import MyLearning from "./MyLearning";
import "./StudentDashboard.css";

function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");

  const menuItems = ["Overview", "My Learning"];

  return (
    <div className="student-dashboard">
      <aside className="student-sidebar">
        <h2>LearnSphere</h2>

        {menuItems.map((item) => (
          <button
            key={item}
            className={activeTab === item ? "active" : ""}
            onClick={() => setActiveTab(item)}
          >
            {item}
          </button>
        ))}
      </aside>

      <main className="student-main">
        {activeTab === "Overview" && (
          <div>
            <h1>Student Dashboard</h1>
            <p>Welcome to your learning dashboard!</p>

            <button onClick={() => setActiveTab("My Learning")}>
              View My Courses
            </button>
          </div>
        )}

        {activeTab === "My Learning" && <MyLearning />}
      </main>
    </div>
  );
}

export default StudentDashboard;