
import { useState } from "react";
import "./Students.css";

function Students() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="students-page">
      <div className="students-heading">
        <div>
          <h2>My Students</h2>
          <p>Manage and monitor students enrolled in your courses.</p>
        </div>
      </div>

      <div className="students-stats">
        <div className="student-stat-card">
          <h3>Total Students</h3>
          <p>0</p>
        </div>

        <div className="student-stat-card">
          <h3>Active Students</h3>
          <p>0</p>
        </div>

        <div className="student-stat-card">
          <h3>Total Courses</h3>
          <p>0</p>
        </div>
      </div>

      <div className="students-content">
      <div className="students-toolbar">
        <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select className="students-course-filter">
            <option value="all">All Courses</option>
        </select>
        </div>

        <div className="students-empty">
          <h3>No students found</h3>
          <p>Students enrolled in your courses will appear here.</p>
        </div>
      </div>
    </div>
  );
}

export default Students;
