import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/adminDashboard.css";

type User = {
  name?: string;
  email?: string;
  user_type?: string;
};

type MenuKey = "dashboard" | "users" | "donations" | "settings";

const ADMIN_EMAIL = "silviaadmin@gmail.com";

const quickStats = [
  {
    label: "TOTAL USERS",
    value: "1,284",
    sub: "+42 this week",
    icon: "👥",
  },
  {
    label: "ACTIVE DONATIONS",
    value: "317",
    sub: "Across all districts",
    icon: "🎁",
  },
  {
    label: "PENDING REVIEWS",
    value: "28",
    sub: "Need moderation",
    icon: "🛡",
  },
];

const recentActivities = [
  "12 new users joined today",
  "8 donation posts are waiting for approval",
  "3 receiver reports were resolved",
  "System health check completed successfully",
];

export default function AdminDashboard(): JSX.Element {
  const rawUser = localStorage.getItem("user");
  const user: User | null = rawUser ? JSON.parse(rawUser) : null;

  const [activeMenu, setActiveMenu] = useState<MenuKey>("dashboard");

  const displayName = user?.name || "Silvia Admin";
  const displayEmail = user?.email || ADMIN_EMAIL;

  const initials = useMemo(() => {
    return displayName
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [displayName]);

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

        <section className="ad-grid">
          <article className="ad-panel">
            <h2>Recent Activity</h2>
            <ul className="ad-list">
              {recentActivities.map((activity) => (
                <li key={activity}>{activity}</li>
              ))}
            </ul>
          </article>

          <article className="ad-panel">
            <h2>Admin Notes</h2>
            <p>
              This is currently a frontend-only admin dashboard. Backend actions
              can be connected later for moderation and analytics.
            </p>
            <button className="ad-primaryBtn" type="button">
              Create Announcement
            </button>
          </article>
        </section>
      </main>
    </div>
  );
}
