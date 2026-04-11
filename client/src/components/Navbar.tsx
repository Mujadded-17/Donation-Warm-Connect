import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/navbar.css";

const API = "http://127.0.0.1:8000/api";

type User = {
  name?: string;
  [key: string]: unknown;
} | null;

export default function Navbar(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User>(null);
  const [searchText, setSearchText] = useState("");

  const clearAuthState = (): void => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login");
  };

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

  const logout = async (): Promise<void> => {
    try {
      const token = localStorage.getItem("token");

      if (token) {
        await fetch(`${API}/logout`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      clearAuthState();
    }
  };

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      try {
        const response = await fetch(`${API}/me`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (cancelled) {
          return;
        }

        if (response.status === 401) {
          clearAuthState();
          return;
        }

        if (response.status === 403) {
          const payload = await response.json().catch(() => ({}));
          const message = String(payload?.message || "").toLowerCase();
          if (message.includes("banned")) {
            clearAuthState();
          }
          return;
        }

        if (response.ok) {
          const payload = await response.json().catch(() => ({}));
          const success = payload?.success;
          const message = String(payload?.message || "").toLowerCase();

          if (success === false && (message.includes("unauthenticated") || message.includes("banned"))) {
            clearAuthState();
          }
        }
      } catch {
        // Ignore transient network failures.
      }
    };

    const onFocus = () => {
      void checkSession();
    };

    const onStorage = () => {
      void checkSession();
    };

    void checkSession();
    const interval = window.setInterval(() => {
      void checkSession();
    }, 2000);

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchText(params.get("q") || "");
  }, [location.pathname, location.search]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const term = searchText.trim();
    navigate(term ? `/explore?q=${encodeURIComponent(term)}` : "/explore");
  };

  return (
    <header className="wc-nav">
      <div className="wc-nav-inner wc-nav-container">
        <Link to="/" className="wc-brand" aria-label="WarmConnect Home">
          <LogoMark />
          <span className="wc-brand-text">WarmConnect</span>
        </Link>

        <nav className="wc-nav-links" aria-label="Primary">
          <Link to="/explore">Explore</Link>
          
          {user && (
            <Link to="/my-donations" className="wc-active-link">
              My Donations
            </Link>
          )}
        </nav>

        <div className="wc-nav-right">
          <form className="wc-search" role="search" onSubmit={handleSearchSubmit}>
            <button type="submit" className="wc-search-submit" aria-label="Search">
              <SearchIcon />
            </button>
            <input
              aria-label="Search"
              placeholder="Search for items near you..."
              autoComplete="off"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </form>

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