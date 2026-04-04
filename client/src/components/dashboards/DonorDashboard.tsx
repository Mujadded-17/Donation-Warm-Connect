import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../../styles/donorDashboard.css";
import { Link } from "react-router-dom";

const API = "http://127.0.0.1:8000/api";

type User = {
  user_id?: number;
  name?: string;
  email?: string;
  user_type?: string;
  phone?: string;
  address?: string;
  profile_url?: string | null;
};

type MenuKey = "dashboard" | "offer" | "impact" | "inbox";
type TabKey = "donations" | "requests" | "community";
type DonationSubTabKey = "active" | "past";

type DonationItem = {
  item_id?: number;
  id?: number;
  item_name?: string;
  title?: string;
  item_title?: string;
  description?: string;
  item_desc?: string;
  image_url?: string;
  image?: string;
  status?: string;
  approval_status?: string;
  created_at?: string;
  posted_at?: string;
  updated_at?: string;
  category_name?: string;
  views?: number;
  responses?: number;
};

type StatCardProps = {
  label: string;
  value: string;
  sub: string;
  icon: string;
};

type ListingCardProps = {
  item: DonationItem;
};

type EmptyStateProps = {
  title: string;
  text: string;
};

export default function DonorDashboard(): JSX.Element {
  const rawUser = localStorage.getItem("user");
  const storedUser: User | null = rawUser ? JSON.parse(rawUser) : null;

  const [user, setUser] = useState<User | null>(storedUser);
  const [activeMenu, setActiveMenu] = useState<MenuKey>("dashboard");
  const [activeTab, setActiveTab] = useState<TabKey>("donations");
  const [donationSubTab, setDonationSubTab] =
    useState<DonationSubTabKey>("active");

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [donationError, setDonationError] = useState("");
  const [donations, setDonations] = useState<DonationItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!storedUser?.user_id) {
        setLoadingProfile(false);
        setLoadingDonations(false);
        return;
      }

      try {
        setLoadingProfile(true);
        const profileRes = await axios.get(`${API}/profile/${storedUser.user_id}`);

        if (profileRes.data?.success) {
          const profileUser = profileRes.data.user as User;
          setUser(profileUser);
          localStorage.setItem("user", JSON.stringify(profileUser));
        } else {
          setProfileError("Could not load profile.");
        }
      } catch (error) {
        console.error("Profile fetch failed:", error);
        setProfileError("Failed to load profile.");
      } finally {
        setLoadingProfile(false);
      }

      try {
        setLoadingDonations(true);
        const donationRes = await axios.get(
          `${API}/user/donations/${storedUser.user_id}`
        );

        const payload = donationRes.data;

        if (Array.isArray(payload)) {
          setDonations(payload);
        } else if (Array.isArray(payload?.data)) {
          setDonations(payload.data);
        } else if (Array.isArray(payload?.items)) {
          setDonations(payload.items);
        } else if (Array.isArray(payload?.donations)) {
          setDonations(payload.donations);
        } else {
          setDonations([]);
        }
      } catch (error) {
        console.error("Donation fetch failed:", error);
        setDonationError("Failed to load donations.");
        setDonations([]);
      } finally {
        setLoadingDonations(false);
      }
    };

    fetchData();
  }, []);

  const displayName = user?.name || user?.email?.split("@")?.[0] || "Donor";

  const roleLabel = useMemo(() => {
    const t = (user?.user_type || "donor").toLowerCase();
    if (t === "donor") return "KINDNESS ADVOCATE";
    if (t === "receiver") return "COMMUNITY MEMBER";
    return "ADMIN";
  }, [user]);

  const initials = useMemo(() => {
    return displayName
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [displayName]);

  const normalizedDonations = useMemo(() => {
    return donations.map((item) => {
      const statusRaw = String(
        item.approval_status || item.status || "pending"
      ).toLowerCase();

      return {
        ...item,
        _id: item.item_id || item.id || Math.random(),
        _title:
          item.item_name || item.title || item.item_title || "Untitled Donation",
        _desc: item.description || item.item_desc || "No description provided.",
        _image:
          item.image_url ||
          item.image ||
          "https://via.placeholder.com/600x400?text=No+Image",
        _status: statusRaw,
        _time: formatRelativeTime(
          item.created_at || item.posted_at || item.updated_at || ""
        ),
      };
    });
  }, [donations]);

  const activeListings = useMemo(() => {
    return normalizedDonations.filter(
      (item: any) =>
        item._status !== "completed" &&
        item._status !== "received" &&
        item._status !== "delivered"
    );
  }, [normalizedDonations]);

  const pastListings = useMemo(() => {
    return normalizedDonations.filter(
      (item: any) =>
        item._status === "completed" ||
        item._status === "received" ||
        item._status === "delivered"
    );
  }, [normalizedDonations]);

  const shownListings =
    donationSubTab === "active" ? activeListings : pastListings;

  const stats = useMemo(() => {
    const total = normalizedDonations.length;
    const active = activeListings.length;
    const completed = pastListings.length;

    return {
      totalDonations: total,
      activeDonations: active,
      completedDonations: completed,
    };
  }, [normalizedDonations, activeListings, pastListings]);

  const isLoading = loadingProfile || loadingDonations;

  return (
    <div className="dd">
      <aside className="dd-sidebar">
        <div className="dd-brand">
          <span className="dd-brandMark" />
          <span className="dd-brandText">warmConnect</span>
        </div>

        <div className="dd-profile">
          <div className="dd-avatar">
            {user?.profile_url ? (
              <img
                src={user.profile_url}
                alt={displayName}
                className="dd-avatarImg"
              />
            ) : (
              <div className="dd-avatarFallback">{initials}</div>
            )}
          </div>

          <div className="dd-profileMeta">
            <div className="dd-profileName">{displayName}</div>
            <div className="dd-profileRole">{roleLabel}</div>
            <div className="dd-profileEmail">{user?.email || "No email"}</div>
          </div>
        </div>

        <nav className="dd-nav">
          <button
            className={`dd-navItem ${activeMenu === "dashboard" ? "isActive" : ""}`}
            onClick={() => setActiveMenu("dashboard")}
          >
            <span className="dd-ico">▦</span>
            Dashboard
          </button>

          <Link
            to="/post-donation"
            className={`dd-navItem ${activeMenu === "offer" ? "isActive" : ""}`}
            onClick={() => setActiveMenu("offer")}
          >
            <span className="dd-ico">✦</span>
            Offer a Gift
          </Link>

          <button
            className={`dd-navItem ${activeMenu === "impact" ? "isActive" : ""}`}
            onClick={() => setActiveMenu("impact")}
          >
            <span className="dd-ico">♡</span>
            My Impact
          </button>

          <button
            className={`dd-navItem ${activeMenu === "inbox" ? "isActive" : ""}`}
            onClick={() => setActiveMenu("inbox")}
          >
            <span className="dd-ico">✉</span>
            Inbox
          </button>

          <Link to="/profile" className="dd-navItem">
            <span className="dd-ico">👤</span>
            My Profile
          </Link>
        </nav>

        <div className="dd-sidebarBottom">
          <Link to="/post-donation" className="dd-createBtn">
            <span className="dd-plus">＋</span> Create New
          </Link>
          <div className="dd-help">
            <span className="dd-helpIco">?</span> How warmConnect works
          </div>
        </div>
      </aside>

      <main className="dd-main">
        <header className="dd-topbar">
          <div className="dd-topLinks">
            <Link to="/" className="dd-topLink">
              Home
            </Link>
            <Link to="/explore" className="dd-topLink">
              Explore
            </Link>
            <span className="dd-topLink">Stories</span>
          </div>

          <div className="dd-topRight">
            <div className="dd-search">
              <span className="dd-searchIco">🔎</span>
              <input placeholder="Find warmth..." />
            </div>

            <button className="dd-iconBtn" aria-label="Notifications">
              🔔
            </button>

            <Link to="/profile" className="dd-iconBtn" aria-label="Profile">
              👤
            </Link>

            <div className="dd-miniAvatar" title={displayName}>
              {user?.profile_url ? (
                <img
                  src={user.profile_url}
                  alt={displayName}
                  className="dd-miniAvatarImg"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          </div>
        </header>

        <section className="dd-greet">
          <h1>
            Hello <span className="dd-nameAccent">{displayName}!</span>
          </h1>
          <p>
            Welcome back to <span className="dd-accent">warmConnect</span>.
            Manage your real donation activity here.
          </p>
        </section>

        {(profileError || donationError) && (
          <div className="dd-empty" style={{ marginBottom: "16px" }}>
            <div className="dd-emptyTitle">Some data could not be loaded</div>
            <div className="dd-emptyText">
              {[profileError, donationError].filter(Boolean).join(" ")}
            </div>
          </div>
        )}

        <section className="dd-stats">
          <StatCard
            label="TOTAL DONATIONS"
            value={`${stats.totalDonations}`}
            sub="From your backend records"
            icon="📦"
          />
          <StatCard
            label="ACTIVE LISTINGS"
            value={`${stats.activeDonations}`}
            sub="Currently available or pending"
            icon="📢"
          />
          <StatCard
            label="COMPLETED GIFTS"
            value={`${stats.completedDonations}`}
            sub="Successfully finished donations"
            icon="✅"
          />
        </section>

        <section className="dd-panel">
          <div className="dd-tabs">
            <button
              className={`dd-tab ${activeTab === "donations" ? "isActive" : ""}`}
              onClick={() => setActiveTab("donations")}
            >
              My Donations
            </button>
            <button
              className={`dd-tab ${activeTab === "requests" ? "isActive" : ""}`}
              onClick={() => setActiveTab("requests")}
            >
              My Requests
            </button>
            <button
              className={`dd-tab ${activeTab === "community" ? "isActive" : ""}`}
              onClick={() => setActiveTab("community")}
            >
              My Community
            </button>

            <div className="dd-tabsRight">
              <button className="dd-sortBtn">
                <span className="dd-sortIco">≡</span> Recent first
              </button>
            </div>
          </div>

          {activeTab === "donations" && (
            <div className="dd-subtabs">
              <button
                className={`dd-subtab ${donationSubTab === "active" ? "isActive" : ""}`}
                onClick={() => setDonationSubTab("active")}
              >
                Active Listings
              </button>
              <button
                className={`dd-subtab ${donationSubTab === "past" ? "isActive" : ""}`}
                onClick={() => setDonationSubTab("past")}
              >
                Past Gifts
              </button>
            </div>
          )}

          <div className="dd-listGrid">
            {isLoading ? (
              <EmptyState
                title="Loading data..."
                text="Please wait while your dashboard data is fetched."
              />
            ) : activeTab === "donations" ? (
              shownListings.length > 0 ? (
                shownListings.map((item: any) => (
                  <ListingCard key={item._id} item={item} />
                ))
              ) : (
                <EmptyState
                  title={
                    donationSubTab === "active"
                      ? "No active donations found"
                      : "No past donations found"
                  }
                  text="No real backend data is available for this section yet."
                />
              )
            ) : (
              <EmptyState
                title="No backend data available"
                text="This section is intentionally empty until the backend endpoint is implemented."
              />
            )}
          </div>
        </section>

        <section className="dd-bottomGrid">
          <div className="dd-box">
            <div className="dd-boxHead">
              <div>
                <div className="dd-boxTitle">Donation Summary</div>
                <div className="dd-boxSub">
                  This section now reflects only backend-connected donor data.
                </div>
              </div>
              <button className="dd-mapBtn" aria-label="Summary">
                📊
              </button>
            </div>

            <div className="dd-mapMock">
              <div className="dd-mapPill">
                Total: {stats.totalDonations} | Active: {stats.activeDonations} |
                Completed: {stats.completedDonations}
              </div>
            </div>
          </div>

          <div className="dd-box dd-dark">
            <div className="dd-darkHead">
              <span className="dd-darkIco">🤝</span>
              <div className="dd-darkTitle">Stay Kind</div>
            </div>

            <ol className="dd-rules">
              <li>Clean and functional gifts only.</li>
              <li>Communicate with warmth.</li>
              <li>Safety first in public spots.</li>
            </ol>

            <a
              className="dd-darkLink"
              href="#guidelines"
              onClick={(e) => e.preventDefault()}
            >
              Community Safety Guidelines
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, sub, icon }: StatCardProps): JSX.Element {
  return (
    <div className="dd-statCard">
      <div className="dd-statTop">
        <div className="dd-statLabel">{label}</div>
        <div className="dd-statIcon">{icon}</div>
      </div>
      <div className="dd-statValue">{value}</div>
      <div className="dd-statSub">{sub}</div>
    </div>
  );
}

function ListingCard({ item }: ListingCardProps): JSX.Element {
  const title =
    item.item_name || item.title || item.item_title || "Untitled Donation";
  const desc = item.description || item.item_desc || "No description provided.";
  const image =
    item.image_url ||
    item.image ||
    "https://via.placeholder.com/600x400?text=No+Image";
  const status = item.approval_status || item.status || "pending";
  const time = formatRelativeTime(
    item.created_at || item.posted_at || item.updated_at || ""
  );

  return (
    <div className="dd-listCard">
      <div className="dd-listMedia">
        <img src={image} alt={title} />
        <div className="dd-chip">{String(status).toUpperCase()}</div>
      </div>

      <div className="dd-listBody">
        <div className="dd-listTitleRow">
          <div className="dd-listTitle">{title}</div>
          <div className="dd-listTime">{time}</div>
        </div>

        <div className="dd-listDesc">{desc}</div>

        <div className="dd-listFooter">
          {item.category_name && (
            <div className="dd-note">🏷️ {item.category_name}</div>
          )}

          {typeof item.responses === "number" && (
            <div className="dd-metric">
              <span className="dd-metricIco">💬</span> {item.responses} Responses
            </div>
          )}

          {typeof item.views === "number" && (
            <div className="dd-metric">
              <span className="dd-metricIco">👁️</span> {item.views} Views
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, text }: EmptyStateProps): JSX.Element {
  return (
    <div className="dd-empty">
      <div className="dd-emptyTitle">{title}</div>
      <div className="dd-emptyText">{text}</div>
    </div>
  );
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return "Unknown time";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  const now = new Date().getTime();
  const diffMs = now - date.getTime();

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}