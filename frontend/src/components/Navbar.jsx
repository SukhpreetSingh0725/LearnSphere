import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const dashboardPath = user
    ? `/${user.role}/dashboard`
    : "/login";

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        LearnSphere
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/#courses">Courses</Link>
        <Link to="/#about">About</Link>

        {user ? (
          <>
            <Link to={dashboardPath}>Dashboard</Link>
            <button
              className="nav-logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;