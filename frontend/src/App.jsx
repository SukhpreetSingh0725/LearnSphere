import { useEffect, useState } from "react";
import "./App.css";

function App() {
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
      .then((response) => response.json())
      .then((result) => {
        setCourses(result.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching courses:", error);
        setError("Unable to load courses. Please make sure the server is running.");
        setLoading(false);
      });
  };
  
  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="app-container">
  <nav className="navbar">
    <h2 className="nav-logo">LearnSphere</h2>

    <div className="nav-links">
      <a href="/">Home</a>
      <a href="#courses">Courses</a>
      <a href="#about">About</a>
    </div>
  </nav>
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
    <div className="course-card" key={course.id}>
      <h3>{course.title}</h3>
      <p>Instructor: {course.instructor}</p>
      <span className="category-badge">{course.category}</span>
      <p>Level: {course.level}</p>
      <p>Price: ₹{course.price}</p>
      <p>Rating: ⭐ {course.rating}</p>
      <button
        className="view-course-btn"
        onClick={() => alert(`You selected: ${course.title}`)}
      >
        View Course
      </button>
      <hr />
    </div>
  ))
) : (
  <p className="no-courses">No courses found. Try changing your search or filters.</p>
)}
      </div>)}
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

export default App;