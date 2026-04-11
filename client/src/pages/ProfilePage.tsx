import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/ProfilePage.css";

const API = "http://127.0.0.1:8000/api";

type User = {
  user_id: number;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  user_type?: string;
  profile_url?: string | null;
};

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  profile_url: string;
};

export default function ProfilePage() {
  const nav = useNavigate();
  const rawUser = localStorage.getItem("user");
  const storedUser: User | null = rawUser ? JSON.parse(rawUser) : null;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [user, setUser] = useState<User | null>(storedUser);
  const [form, setForm] = useState<ProfileForm>({
    name: storedUser?.name || "",
    email: storedUser?.email || "",
    phone: storedUser?.phone || "",
    address: storedUser?.address || "",
    profile_url: storedUser?.profile_url || "",
  });

  useEffect(() => {
    if (!storedUser?.user_id) {
      nav("/login");
      return;
    }

    fetchProfile(storedUser.user_id);
  }, []);

  const fetchProfile = async (userId: number) => {
    setLoading(true);
    setError("");
    setMsg("");

    const token = localStorage.getItem("token") || "";

    try {
      const res = await axios.get(`${API}/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.data?.success) {
        const profileUser = res.data.user as User;

        setUser(profileUser);
        setForm({
          name: profileUser.name || "",
          email: profileUser.email || "",
          phone: profileUser.phone || "",
          address: profileUser.address || "",
          profile_url: profileUser.profile_url || "",
        });

        localStorage.setItem("user", JSON.stringify(profileUser));
      } else {
        setError("Could not load profile.");
      }
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status === 401) {
        setError("Session expired. Please login again.");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setTimeout(() => nav("/login"), 1500);
      } else {
        setError(err?.response?.data?.message || "Failed to load profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.user_id) {
      setError("User not found. Please login again.");
      return;
    }

    setSaving(true);
    setError("");
    setMsg("");

    const token = localStorage.getItem("token") || "";

    try {
      const res = await axios.put(`${API}/profile/${user.user_id}`, form, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data?.success) {
        const updatedUser = res.data.user as User;
        setUser(updatedUser);

        localStorage.setItem("user", JSON.stringify(updatedUser));
        setMsg("Profile updated successfully.");
      } else {
        setError(res.data?.message || "Profile update failed.");
      }
    } catch (err: any) {
      console.error(err);

      if (err?.response?.status === 401) {
        setError("Session expired. Please login again.");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setTimeout(() => nav("/login"), 1500);
      } else if (err?.response?.status === 422 && err?.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : "Validation failed.");
      } else {
        setError(err?.response?.data?.message || "Profile update failed.");
      }
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = useMemo(() => {
    const role = String(user?.user_type || "").toLowerCase();
    if (role === "donor") return "Donor Profile";
    if (role === "receiver") return "Receiver Profile";
    return "User Profile";
  }, [user]);

  const initials = useMemo(() => {
    const name = user?.name?.trim();
    if (!name) return "U";
    return name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [user]);

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatarWrap">
            {form.profile_url ? (
              <img
                src={form.profile_url}
                alt="Profile"
                className="profile-avatarImage"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="profile-avatarFallback">{initials}</div>
            )}
          </div>

          <div className="profile-headerText">
            <h1>{roleLabel}</h1>
            <p>View and update your WarmConnect account details.</p>
          </div>

          <div className="profile-actions">
            <Link to="/dashboard" className="profile-backBtn">
              Back to Dashboard
            </Link>
          </div>
        </div>

        {msg && <div className="profile-message success">{msg}</div>}
        {error && <div className="profile-message error">{error}</div>}

        <form onSubmit={submit} className="profile-form">
          <div className="profile-grid">
            <div className="profile-field">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="profile-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="profile-field">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="user_type">Account Type</label>
              <input
                id="user_type"
                value={user?.user_type || ""}
                disabled
                className="profile-readonly"
              />
            </div>

            <div className="profile-field profile-field-full">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={onChange}
                placeholder="Enter your address"
                rows={3}
              />
            </div>

            <div className="profile-field profile-field-full">
              <label htmlFor="profile_url">Profile Image URL</label>
              <input
                id="profile_url"
                name="profile_url"
                value={form.profile_url}
                onChange={onChange}
                placeholder="Paste image URL"
              />
            </div>
          </div>

          <div className="profile-footer">
            <button type="submit" className="profile-saveBtn" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}