import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../../styles/adminDashboard.css";

type User = {
  user_id?: number;
  name?: string;
  email?: string;
  user_type?: string;
  profile_url?: string | null;
};

type MenuKey = "dashboard" | "users" | "donations" | "settings";

type Item = {
  item_id: number;
  title?: string;
  description?: string;
  status?: string;
  post_date?: string;
  pickup_location?: string;
  images?: string;
  donor_id?: number;
};

const ADMIN_EMAIL = "silviaadmin@gmail.com";
const API = "http://127.0.0.1:8000/api";

export default function AdminDashboard(): JSX.Element {
  const rawUser = localStorage.getItem("user");
  const storedUser: User | null = rawUser ? JSON.parse(rawUser) : null;

  const [user, setUser] = useState<User | null>(storedUser);
  const [items, setItems] = useState<Item[]>([]);
  const [activeMenu, setActiveMenu] = useState<MenuKey>("dashboard");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [itemError, setItemError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token") || "";
      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      if (storedUser?.user_id) {
        try {
          setLoadingProfile(true);
          const profileRes = await axios.get(`${API}/profile/${storedUser.user_id}`, {
            headers,
          });

          if (profileRes.data?.success && profileRes.data?.user) {
            const profileUser = profileRes.data.user as User;
            setUser(profileUser);
            localStorage.setItem("user", JSON.stringify(profileUser));
          } else {
            setProfileError("Could not load profile.");
          }
        } catch (error) {
          console.error("Admin profile fetch failed:", error);
          setProfileError("Failed to load admin profile.");
        } finally {
          setLoadingProfile(false);
        }
      } else {
        setLoadingProfile(false);
      }

      try {
        setLoadingItems(true);
        const itemRes = await axios.get(`${API}/admin/items/pending`, { headers });
        const payload = itemRes.data;
        setItems(Array.isArray(payload) ? payload : []);
      } catch (error) {
        console.error("Admin items fetch failed:", error);
        setItemError("Failed to load donation moderation data.");
        setItems([]);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchData();
  }, []);

  const updateItemStatus = async (itemId: number, status: "approved" | "rejected") => {
    const token = localStorage.getItem("token") || "";

    try {
      setUpdatingId(itemId);

      await axios.put(
        `${API}/admin/items/${itemId}/status`,
        { status },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setItems((prev) =>
        prev.map((item) =>
          item.item_id === itemId ? { ...item, status } : item
        )
      );
    } catch (error) {
      console.error("Status update failed:", error);
      alert("Failed to update item status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const displayName = user?.name || "Silvia Admin";
  const displayEmail = user?.email || ADMIN_EMAIL;

  const initials = useMemo(() => {
    return displayName
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [displayName]);

  const stats = useMemo(() => {
    const total = items.length;
    const pending = items.filter(
      (item) => String(item.status || "").toLowerCase() === "pending"
    ).length;
    const approved = items.filter(
      (item) => String(item.status || "").toLowerCase() === "approved"
    ).length;
    const rejected = items.filter(
      (item) => String(item.status || "").toLowerCase() === "rejected"
    ).length;

    return {
      total,
      pending,
      approved,
      rejected,
    };
  }, [items]);

  const recentActivities = useMemo(() => {
    return [
      `${stats.pending} items are waiting for review`,
      `${stats.approved} items are approved`,
      `${stats.rejected} items are rejected`,
      `${stats.total} total items loaded from backend`,
    ];
  }, [stats]);

  const pendingItems = useMemo(() => {
    return items.filter(
      (item) => String(item.status || "").toLowerCase() === "pending"
    );
  }, [items]);

  const isLoading = loadingProfile || loadingItems;

  const quickStats = [
    {
      label: "TOTAL ITEMS",
      value: `${stats.total}`,
      sub: "From /admin/items/pending",
      icon: "📦",
    },
    {
      label: "APPROVED",
      value: `${stats.approved}`,
      sub: "Visible in explore",
      icon: "✅",
    },
    {
      label: "PENDING REVIEW",
      value: `${stats.pending}`,
      sub: "Need admin action",
      icon: "🛡",
    },
  ];

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="ad">
      <aside className="ad-sidebar">
        <div className="ad-brand">
          <span className="ad-brandMark" />
          <span className="ad-brandText">warmConnect Admin</span>
        </div>

        <div className="ad-profile">
          <div className="ad-avatar">{initials}</div>
          <div className="ad-profileMeta">
            <div className="ad-profileName">{displayName}</div>
            <div className="ad-profileRole">SYSTEM ADMIN</div>
            <div className="ad-profileEmail">{displayEmail}</div>
          </div>
        </div>

        <nav className="ad-nav">
          <button
            className={`ad-navItem ${activeMenu === "dashboard" ? "isActive" : ""}`}
            onClick={() => setActiveMenu("dashboard")}
          >
            <span className="ad-ico">▦</span>
            Dashboard
          </button>

          <button
            className={`ad-navItem ${activeMenu === "users" ? "isActive" : ""}`}
            onClick={() => setActiveMenu("users")}
          >
            <span className="ad-ico">👤</span>
            User Management
          </button>

          <button
            className={`ad-navItem ${activeMenu === "donations" ? "isActive" : ""}`}
            onClick={() => setActiveMenu("donations")}
          >
            <span className="ad-ico">🎁</span>
            Donation Review
          </button>

          <button
            className={`ad-navItem ${activeMenu === "settings" ? "isActive" : ""}`}
            onClick={() => setActiveMenu("settings")}
          >
            <span className="ad-ico">⚙</span>
            Platform Settings
          </button>

          <Link to="/profile" className="ad-navItem">
            <span className="ad-ico">🙍</span>
            My Profile
          </Link>
        </nav>
      </aside>

      <main className="ad-main">
        <header className="ad-topbar">
          <div>
            <h1>
              Welcome back, <span>{displayName}</span>
            </h1>
            <p>Monitor users, donations, and platform activity from one place.</p>
          </div>

          <div className="ad-topRight">
            <Link to="/" className="ad-ghostBtn">
              Home
            </Link>
            <Link to="/explore" className="ad-ghostBtn">
              Explore
            </Link>
          </div>
        </header>

        <section className="ad-stats">
          {quickStats.map((item) => (
            <article className="ad-statCard" key={item.label}>
              <div className="ad-statTop">
                <span className="ad-statLabel">{item.label}</span>
                <span className="ad-statIcon">{item.icon}</span>
              </div>
              <div className="ad-statValue">{item.value}</div>
              <div className="ad-statSub">{item.sub}</div>
            </article>
          ))}
        </section>

        {(profileError || itemError) && (
          <div className="ad-empty" style={{ marginTop: "14px" }}>
            {[profileError, itemError].filter(Boolean).join(" ")}
          </div>
        )}

        <section className="ad-grid">
          <article className="ad-panel">
            <h2>Recent Activity</h2>
            {isLoading ? (
              <div className="ad-loading">Loading activity...</div>
            ) : (
              <ul className="ad-list">
                {recentActivities.map((activity) => (
                  <li key={activity}>{activity}</li>
                ))}
              </ul>
            )}
          </article>

          <article className="ad-panel">
            <h2>Pending Donations</h2>
            {isLoading && <div className="ad-loading">Loading donations...</div>}

            {!isLoading && pendingItems.length === 0 && (
              <div className="ad-empty">No pending donations right now.</div>
            )}

            {!isLoading && pendingItems.length > 0 && (
              <div className="ad-itemList">
                {pendingItems.slice(0, 6).map((item) => (
                  <div className="ad-itemRow" key={item.item_id}>
                    <div className="ad-itemMain">
                      <div className="ad-itemTitle">{item.title || "Untitled item"}</div>
                      <div className="ad-itemMeta">
                        ID #{item.item_id} • {formatDate(item.post_date)}
                      </div>
                    </div>

                    <div className="ad-itemActions">
                      <button
                        type="button"
                        className="ad-approveBtn"
                        disabled={updatingId === item.item_id}
                        onClick={() => updateItemStatus(item.item_id, "approved")}
                      >
                        {updatingId === item.item_id ? "Updating..." : "Approve"}
                      </button>

                      <button
                        type="button"
                        className="ad-rejectBtn"
                        disabled={updatingId === item.item_id}
                        onClick={() => updateItemStatus(item.item_id, "rejected")}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}
