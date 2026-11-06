import Navbar from "./components/Navbar";
import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import "./App.css";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import CourseDetails from "./pages/CourseDetails";

// Temporary dashboards — we'll build their actual features later.
function Dashboard({ role }) {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-container">
      <h1>{role} Dashboard</h1>
      <h2>Welcome, {user?.name}!</h2>
      <p>You are logged in as {user?.role}.</p>

      <button
        className="view-course-btn"
        onClick={() => {
          logout();
          window.location.href = "/login";
        }}
      >
        Logout
      </button>
    </div>
  );
}

// Existing LearnSphere homepage
function Home() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState("All");

  const filteredCourses = courses
    .filter((course) =>
      course.title.toLowerCase().includes(search.toLowerCase())
    )
    .filter((course) =>
      category === "All" || course.category === category
    )
    .filter((course) =>
      maxPrice === "All" || course.price <= Number(maxPrice)
    );

  const fetchCourses = () => {
    setLoading(true);
    setError("");

    fetch("http://localhost:5000/api/courses")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }
        return response.json();
      })
      .then((result) => {
        setCourses(result.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching courses:", error);
        setError(
          "Unable to load courses. Please make sure the server is running."
        );
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="app-container">
      <p>Welcome to your online learning platform!</p>

      <h2 id="courses">Available Courses</h2>

      <p>Showing {filteredCourses.length} courses</p>

      <input
        type="text"
        placeholder="Search courses..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="All">All Categories</option>
        <option value="Programming">Programming</option>
        <option value="Web Development">Web Development</option>
        <option value="AI/ML">AI/ML</option>
      </select>

      <select
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)}
      >
        <option value="All">All Prices</option>
        <option value="500">Under ₹500</option>
        <option value="600">Under ₹600</option>
        <option value="800">Under ₹800</option>
      </select>

      {loading ? (
        <p>Loading courses...</p>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchCourses}>Try Again</button>
        </div>
      ) : (
        <div className="course-grid">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
                <div className="course-card" key={course._id || course.id}>
                <h3>{course.title}</h3>
                <p>Instructor: {
                typeof course.instructor === "object"
                      ? course.instructor?.name || "LearnSphere Instructor"
                      : course.instructor || "LearnSphere Instructor"
                  }
                  </p>
                <span className="category-badge">
                  {course.category}
                </span>
                <p>Level: {course.level}</p>
                <p>Price: ₹{course.price}</p>
                <p>Rating: ⭐ {course.rating}</p>

                <button
                  className="view-course-btn"
                  onClick={() => navigate(`/courses/${course._id || course.id}`)}
                >
                  View Course
                </button>
                <hr />
              </div>
            ))
          ) : (
            <p className="no-courses">
              No courses found. Try changing your search or filters.
            </p>
          )}
        </div>
      )}

      <section id="about" className="about-section">
        <h2>About LearnSphere</h2>
        <p>
          LearnSphere is an online learning platform where students can
          explore courses, learn new skills, and grow at their own pace.
        </p>
      </section>

      <footer className="footer">
        <h2>LearnSphere</h2>
        <p>Learn new skills. Create new opportunities.</p>
        <p>© 2026 LearnSphere. All rights reserved.</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <>
      <Navbar />
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/courses/:id" element={<CourseDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Student routes */}
      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route
          path="/student/dashboard"
          element={<Dashboard role="Student" />}
        />
      </Route>

      {/* Instructor routes */}
      <Route element={<ProtectedRoute allowedRoles={["instructor"]} />}>
        <Route
          path="/instructor/dashboard"
          element={<Dashboard role="Instructor" />}
        />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route
          path="/admin/dashboard"
          element={<Dashboard role="Admin" />}
        />
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default App;