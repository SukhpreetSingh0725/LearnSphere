import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./AdminDashboard.css";
import AdminCourses from "./AdminCourses";
import AdminUsers from "./AdminUsers";

function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("Overview");

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/admin/stats",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load statistics");
        }

        setStats(data.data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStats();
    }
  }, [token]);

  const menuItems = [
    "Overview",
    "Course Management",
    "User Management",
    "Instructor Management",
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>LearnSphere</h2>
          <p>Admin Panel</p>
        </div>

        <nav className="admin-menu">
          {menuItems.map((item) => (
            <button
              key={item}
              className={
                activeTab === item
                  ? "admin-menu-item active"
                  : "admin-menu-item"
              }
              onClick={() => setActiveTab(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <button className="admin-logout" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>{activeTab}</h1>
            <p>Manage your LearnSphere platform</p>
          </div>

          <div className="admin-profile">
            <span>{user?.name || "Admin"}</span>
            <span className="admin-role">Administrator</span>
          </div>
        </header>

        {activeTab === "Overview" && (
          <section className="admin-content">
            <h2>Welcome, {user?.name || "Admin"}!</h2>
            <p>Here's your platform administration workspace.</p>

            {loading && <p>Loading statistics...</p>}

            {error && <p>{error}</p>}

            {!loading && !error && stats && (
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <h3>Total Courses</h3>
                  <p>{stats.totalCourses}</p>
                </div>

                <div className="admin-stat-card">
                  <h3>Pending Courses</h3>
                  <p>{stats.pendingCourses}</p>
                </div>

                <div className="admin-stat-card">
                  <h3>Total Students</h3>
                  <p>{stats.totalStudents}</p>
                </div>

                <div className="admin-stat-card">
                  <h3>Total Instructors</h3>
                  <p>{stats.totalInstructors}</p>
                </div>
              </div>
            )}
          </section>
        )}

          {activeTab === "Course Management" && (
            <section className="admin-content">
              <AdminCourses />
            </section>
          )}

            {activeTab === "User Management" && (
              <section className="admin-content">
                <AdminUsers />
              </section>
            )}

            {activeTab === "Instructor Management" && (
              <section className="admin-content">
                <h2>Instructor Management</h2>
                <p>This section will be implemented next.</p>
              </section>
            )}
      </main>
    </div>
  );
}

export default AdminDashboard;
