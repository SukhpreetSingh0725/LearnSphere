import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./AdminUsers.css";

function AdminUsers() {
  const { token } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    if (!token) return;
  
    let ignore = false;
  
    fetch("http://localhost:5000/api/admin/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const data = await response.json();
  
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch users");
        }
  
        return data;
      })
      .then((data) => {
        if (!ignore) {
          setUsers(
            data.data.filter(
              (user) =>
                user.role === "student" || user.role === "instructor"
            )
          );
        }
      })
      .catch((error) => {
        if (!ignore) {
          setError(error.message);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
  
    return () => {
      ignore = true;
    };
  }, [token]);

  const refreshUsers = async () => {
    try {
      setLoading(true);
      setError("");
  
      const response = await fetch(
        "http://localhost:5000/api/admin/users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const data = await response.json();
  
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch users");
      }
  
      setUsers(
        data.data.filter(
          (user) => user.role === "student" || user.role === "instructor"
        )
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, currentStatus) => {
    try {
      setUpdatingId(userId);
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/admin/users/${userId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isActive: !currentStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update account");
      }

      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user._id === userId
            ? { ...user, isActive: !currentStatus }
            : user
        )
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setUpdatingId("");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === "all" || user.role === roleFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.isActive) ||
      (statusFilter === "inactive" && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="admin-users">
      <div className="admin-users-heading">
        <div>
          <h2>User Management</h2>
          <p>Manage student and instructor accounts.</p>
        </div>

        <button onClick={refreshUsers}>Refresh Users</button>
      </div>

      <div className="admin-user-filters">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="instructor">Instructors</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && <p className="admin-user-error">{error}</p>}

      {loading ? (
        <p>Loading users...</p>
      ) : filteredUsers.length === 0 ? (
        <p className="admin-user-empty">No users found.</p>
      ) : (
        <div className="admin-users-table-wrapper">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`user-role ${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <span
                      className={
                        user.isActive
                          ? "user-status active"
                          : "user-status inactive"
                      }
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      className={
                        user.isActive
                          ? "user-action deactivate"
                          : "user-action activate"
                      }
                      disabled={updatingId === user._id}
                      onClick={() =>
                        handleStatusChange(user._id, user.isActive)
                      }
                    >
                      {updatingId === user._id
                        ? "Updating..."
                        : user.isActive
                          ? "Deactivate"
                          : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="admin-users-count">
        Showing {filteredUsers.length} of {users.length} users
      </p>
    </div>
  );
}

export default AdminUsers;
