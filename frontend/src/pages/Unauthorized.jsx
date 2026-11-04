import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Unauthorized() {
  const { user } = useAuth();

  const dashboardPath = user
    ? `/${user.role}/dashboard`
    : "/login";

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>403</h1>
        <h2>Access Denied</h2>

        <p>
          Sorry, you don't have permission to access this page.
        </p>

        <Link to={dashboardPath} className="view-course-btn">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default Unauthorized;