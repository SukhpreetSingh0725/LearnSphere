import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import "./CreateCourse.css";

function CreateCourse() {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    level: "Beginner",
    price: "",
    thumbnail: "",
  });
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      setLoading(true);
      setMessage("");
  
      const response = await fetch(
        "http://localhost:5000/api/courses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            price: Number(formData.price),
          }),
        }
      );
  
      const result = await response.json();
  
      if (response.ok && result.success) {
        setMessage("Course created successfully!");
  
        setFormData({
          title: "",
          category: "",
          description: "",
          level: "Beginner",
          price: "",
          thumbnail: "",
        });
      } else {
        setMessage(result.message || "Failed to create course.");
      }
    } catch (error) {
      console.error("Create course error:", error);
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-course-page">
      <div className="create-course-header">
        <h2>Create New Course</h2>
        <p>Share your knowledge with students on LearnSphere.</p>
      </div>

      {message && (
        <p className={`create-course-message ${
            message.includes("successfully") ? "success" : "error"
        }`}>
            {message}
        </p>
        )}

      <form className="create-course-form" onSubmit={handleSubmit}>

        <div className="form-group">
          <label>Course Title</label>
          <input
            type="text"
            name="title"
            placeholder="Enter course title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <input
            type="text"
            name="category"
            placeholder="e.g. Web Development"
            value={formData.category}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            placeholder="Describe what students will learn..."
            value={formData.description}
            onChange={handleChange}
            rows="5"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Difficulty Level</label>
            <select
              name="level"
              value={formData.level}
              onChange={handleChange}
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="form-group">
            <label>Price (₹)</label>
            <input
              type="number"
              name="price"
              placeholder="Enter price"
              min="0"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Thumbnail URL (Optional)</label>
          <input
            type="url"
            name="thumbnail"
            placeholder="https://example.com/image.jpg"
            value={formData.thumbnail}
            onChange={handleChange}
          />
        </div>

        <button
            type="submit"
            className="submit-course-form-btn"
            disabled={loading}
            >
            {loading ? "Creating Course..." : "Create Course"}
        </button>

      </form>
    </div>
  );
}

export default CreateCourse;
