
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { uploadProfileImage } from "../utils/uploadVideo";
import "./InstructorSettings.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const InstructorSettings = () => {
    const { token } = useAuth();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        bio: "",
        profileImage: ""
    });

    const [preview, setPreview] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch(`${API}/api/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || "Unable to load profile");
                }

                setFormData({
                    name: data.data.name || "",
                    email: data.data.email || "",
                    bio: data.data.bio || "",
                    profileImage: data.data.profileImage || ""
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchProfile();
        }
    }, [token]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        setMessage("");
        setError("");

        const localPreview = URL.createObjectURL(file);
        setPreview(localPreview);
        setUploading(true);

        try {
            const imageUrl = await uploadProfileImage({
                file,
                token
            });

            setFormData((prev) => ({
                ...prev,
                profileImage: imageUrl
            }));

            setPreview("");
            URL.revokeObjectURL(localPreview);
            
            setMessage("Profile picture uploaded. Click Save Changes to apply it.");
        } catch (err) {
            setPreview("");
            URL.revokeObjectURL(localPreview);
            setError(err.message);
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSaving(true);
        setMessage("");
        setError("");

        try {
            const response = await fetch(`${API}/api/auth/profile`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    bio: formData.bio,
                    profileImage: formData.profileImage
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Profile update failed");
            }

            setFormData((prev) => ({
                ...prev,
                ...data.data
            }));

            setMessage("Profile updated successfully!");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="instructor-settings">Loading profile...</div>;
    }

    return (
        <div className="instructor-settings">
            <div className="settings-header">
                <h2>Account Settings</h2>
                <p>Manage your instructor profile information.</p>
            </div>

            <form className="settings-form" onSubmit={handleSubmit}>

                <div className="settings-profile-image">
                    <div className="settings-avatar">
                        {(preview || formData.profileImage) ? (
                            <img
                                src={preview || formData.profileImage}
                                alt="Profile"
                            />
                        ) : (
                            <span>
                                {formData.name?.charAt(0)?.toUpperCase() || "I"}
                            </span>
                        )}
                    </div>

                    <div className="settings-image-info">
                        <label htmlFor="profileImageUpload">
                            {uploading ? "Uploading..." : "Choose Profile Picture"}
                        </label>

                        <input
                            type="file"
                            id="profileImageUpload"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageChange}
                            disabled={uploading}
                        />

                        <small>JPG, PNG or WebP. Maximum size: 5 MB.</small>
                    </div>
                </div>

                <div className="settings-field">
                    <label>Full Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        minLength="2"
                        maxLength="50"
                        required
                    />
                </div>

                <div className="settings-field">
                    <label>Email Address</label>
                    <input
                        type="email"
                        value={formData.email}
                        disabled
                    />
                    <small>Email address cannot be changed here.</small>
                </div>

                <div className="settings-field">
                    <label>Bio</label>
                    <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        maxLength="500"
                        rows="4"
                        placeholder="Tell students about yourself..."
                    />
                </div>

                {message && (
                    <p className="settings-success">{message}</p>
                )}

                {error && (
                    <p className="settings-error">{error}</p>
                )}

                <button type="submit" disabled={saving || uploading}>
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </form>
        </div>
    );
};

export default InstructorSettings;
