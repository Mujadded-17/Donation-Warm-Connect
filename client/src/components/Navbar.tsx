import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/navbar.css";

type User = {
  name?: string;
  [key: string]: unknown;
} | null;

export default function Navbar(): JSX.Element {
  const navigate = useNavigate();
  const [user, setUser] = useState<User>(null);

  const readUser = (): User => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null") as User;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    setUser(readUser());

    const onStorage = (): void => setUser(readUser());
    const onAuthChanged = (): void => setUser(readUser());

    window.addEventListener("storage", onStorage);
    window.addEventListener("auth-changed", onAuthChanged as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth-changed", onAuthChanged as EventListener);
    };
  }, []);

  const logout = (): void => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login");
  };

  return (
    <header className="wc-nav">
      <div className="wc-nav-inner wc-nav-container">
        <Link to="/" className="wc-brand" aria-label="WarmConnect Home">
          <LogoMark />
          <span className="wc-brand-text">WarmConnect</span>
        </Link>

        <nav className="wc-nav-links" aria-label="Primary">
          <Link to="/items">Explore</Link>
          <a href="#how">How it Works</a>
          <a href="#stories">Stories</a>
          {user && (
            <>
              <Link to="/post-donation" className="wc-post-link">
                Post a Donation
              </Link>
              <Link to="/my-donations" className="wc-active-link">
                My Donations
              </Link>
            </>
          )}
        </nav>

        <div className="wc-nav-right">
          <div className="wc-search" role="search">
            <SearchIcon />
            <input
              aria-label="Search"
              placeholder="Search for items near you..."
              autoComplete="off"
            />
          </div>

          <div className="wc-nav-actions">
            {!user ? (
              <>
                <Link to="/login" className="wc-btn wc-btn-ghost">
                  Login
                </Link>
                <Link to="/register" className="wc-btn wc-btn-solid">
                  Register
                </Link>
              </>
            ) : (
              <>
                <div
                  className="wc-user-mini wc-user-mini-click"
                  title="Go to Dashboard"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate("/dashboard")}
                  onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === "Enter" || e.key === " ") {
                      navigate("/dashboard");
                    }
                  }}
                >
                  <div className="wc-avatar" aria-hidden="true" />
                  <UserIcon />
                  <span className="wc-user-mini-name">
                    {user?.name || "User"}
                  </span>
                </div>

                <button
                  type="button"
                  className="wc-btn wc-btn-ghost"
                  onClick={logout}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function LogoMark(): JSX.Element {
  return (
    <svg className="wc-logo" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.2 8.4c2.7-3.5 7.2-4.2 10.3-1.8 1.5 1.2 2.2 2.9 2.2 4.7 0 3.8-3.4 6.9-6.7 8.7-3-1.8-6.7-4.9-6.7-8.7 0-1.1.3-2.1.9-2.9z"
        fill="var(--wc-orange)"
        opacity="0.95"
      />
      <path
        d="M4 13c.8 3.8 4.4 6.7 8 8.8 3.6-2.1 7.2-5 8-8.8"
        fill="none"
        stroke="var(--wc-orange-dark)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon(): JSX.Element {
  return (
    <svg className="wc-search-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16.5 16.5 21 21"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserIcon(): JSX.Element {
  return (
    <svg className="wc-user-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M4.5 20a7.5 7.5 0 0 1 15 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}