import { useMemo, useState } from "react";
import "../../styles/receiverDashboard.css";

type User = {
  name?: string;
  email?: string;
  user_type?: string;
};

type MenuKey = "dashboard" | "browse" | "requests" | "messages";
type TabKey = "matched" | "saved" | "community";

type RequestItem = {
  id: number;
  status: string;
  title: string;
  time: string;
  desc: string;
  location?: string;
  donorName?: string;
  image: string;
};

type StatCardProps = {
  label: string;
  value: string;
  sub: string;
  icon: string;
};

type RequestCardProps = {
  item: RequestItem;
};

type EmptyStateProps = {
  title: string;
  text: string;
};

export default function ReceiverDashboard(): JSX.Element {
  const rawUser = localStorage.getItem("user");
  const user: User | null = rawUser ? JSON.parse(rawUser) : null;

  const [activeMenu, setActiveMenu] = useState<MenuKey>("dashboard");
  const [activeTab, setActiveTab] = useState<TabKey>("matched");

  const displayName = user?.name || user?.email?.split("@")?.[0] || "Friend";

  const roleLabel = useMemo(() => {
    const t = (user?.user_type || "receiver").toLowerCase();
    if (t === "receiver") return "COMMUNITY MEMBER";
    if (t === "donor") return "KINDNESS ADVOCATE";
    return "ADMIN";
  }, [user]);

  const stats = {
    matchesFound: 8,
    nearbyOffers: 17,
    successfulReceives: 5,
    communityScore: 92,
    topLabel: "Growing Support Network",
  };

  const matchedItems: RequestItem[] = [
    {
      id: 1,
      status: "MATCHED",
      title: "Winter Clothes Bundle",
      time: "1h ago",
      desc: "Warm jackets and sweaters in good condition for adults and teens.",
      location: "Mirpur, Dhaka",
      donorName: "Amena S.",
      image:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&h=800&fit=crop",
    },
    {
      id: 2,
      status: "PICKUP READY",
      title: "Rice Cooker",
      time: "Today",
      desc: "Functional rice cooker, lightly used and cleaned, available for pickup.",
      location: "Dhanmondi, Dhaka",
      donorName: "Karim H.",
      image:
        "https://images.unsplash.com/photo-1585515656533-46995b3d60e2?w=1200&h=800&fit=crop",
    },
  ];

  return (
    <div className="rd">
      <aside className="rd-sidebar">
        <div className="rd-brand">
          <span className="rd-brandMark" />
          <span className="rd-brandText">warmConnect</span>
        </div>

        <div className="rd-profile">
          <div className="rd-avatar">
            <span className="rd-avatarInner" />
          </div>
          <div className="rd-profileMeta">
            <div className="rd-profileName">{displayName}</div>
            <div className="rd-profileRole">{roleLabel}</div>
          </div>
        </div>

        <nav className="rd-nav">
          <button
            className={`rd-navItem ${activeMenu === "dashboard" ? "isActive" : ""}`}
            onClick={() => setActiveMenu("dashboard")}
          >
            <span className="rd-ico">▦</span>
            Dashboard
          </button>

          <button
            className={`rd-navItem ${activeMenu === "browse" ? "isActive" : ""}`}
            onClick={() => setActiveMenu("browse")}
          >
            <span className="rd-ico">⌕</span>
            Browse Gifts
          </button>

          <button
            className={`rd-navItem ${activeMenu === "requests" ? "isActive" : ""}`}
            onClick={() => setActiveMenu("requests")}
          >
            <span className="rd-ico">♡</span>
            My Requests
          </button>

          <button
            className={`rd-navItem ${activeMenu === "messages" ? "isActive" : ""}`}
            onClick={() => setActiveMenu("messages")}
          >
            <span className="rd-ico">✉</span>
            Messages
            <span className="rd-badge">2</span>
          </button>
        </nav>

        <div className="rd-sidebarBottom">
          <button className="rd-createBtn">
            <span className="rd-plus">＋</span> Create Request
          </button>
          <div className="rd-help">
            <span className="rd-helpIco">?</span> How warmConnect works
          </div>
        </div>
      </aside>

      <main className="rd-main">
        <header className="rd-topbar">
          <div className="rd-topLinks">
            <span className="rd-topLink">Home</span>
            <span className="rd-topLink">Explore</span>
            <span className="rd-topLink">Stories</span>
          </div>

          <div className="rd-topRight">
            <div className="rd-search">
              <span className="rd-searchIco">🔎</span>
              <input placeholder="Search support..." />
            </div>

            <button className="rd-iconBtn" aria-label="Notifications">
              🔔
            </button>
            <button className="rd-iconBtn" aria-label="Settings">
              ⚙️
            </button>
            <div className="rd-miniAvatar" title={displayName}>
              <span />
            </div>
          </div>
        </header>

        <section className="rd-greet">
          <h1>
            Welcome <span className="rd-nameAccent">{displayName}!</span>
          </h1>
          <p>
            Here&apos;s your <span className="rd-accent">warmConnect</span> support
            space. Find help, connect locally, and stay informed.
          </p>
        </section>

        <section className="rd-stats">
          <StatCard
            label="MATCHES FOUND"
            value={`${stats.matchesFound}`}
            sub={`+${stats.nearbyOffers} nearby offers`}
            icon="🎁"
          />
          <StatCard
            label="SUCCESSFUL RECEIVES"
            value={`${stats.successfulReceives}`}
            sub="Support received"
            icon="🤝"
          />
          <StatCard
            label="COMMUNITY SCORE"
            value={`${stats.communityScore}`}
            sub={stats.topLabel}
            icon="✨"
          />
        </section>

        <section className="rd-panel">
          <div className="rd-tabs">
            <button
              className={`rd-tab ${activeTab === "matched" ? "isActive" : ""}`}
              onClick={() => setActiveTab("matched")}
            >
              Matched Offers
            </button>
            <button
              className={`rd-tab ${activeTab === "saved" ? "isActive" : ""}`}
              onClick={() => setActiveTab("saved")}
            >
              Saved Items
            </button>
            <button
              className={`rd-tab ${activeTab === "community" ? "isActive" : ""}`}
              onClick={() => setActiveTab("community")}
            >
              Community
            </button>

            <div className="rd-tabsRight">
              <button className="rd-sortBtn">
                <span className="rd-sortIco">≡</span> Recent first
              </button>
            </div>
          </div>

          <div className="rd-listGrid">
            {activeTab === "matched" ? (
              matchedItems.map((item) => <RequestCard key={item.id} item={item} />)
            ) : (
              <EmptyState
                title="Nothing here yet"
                text="This section will show data when you connect it to your backend."
              />
            )}
          </div>
        </section>

        <section className="rd-bottomGrid">
          <div className="rd-box">
            <div className="rd-boxHead">
              <div>
                <div className="rd-boxTitle">Nearby Support Map</div>
                <div className="rd-boxSub">
                  See available support around your area.
                </div>
              </div>
              <button className="rd-mapBtn" aria-label="Map">
                🗺️
              </button>
            </div>

            <div className="rd-mapMock">
              <div className="rd-mapPin" />
              <div className="rd-mapPill">Nearby Matching Zone</div>
            </div>
          </div>

          <div className="rd-box rd-dark">
            <div className="rd-darkHead">
              <span className="rd-darkIco">💛</span>
              <div className="rd-darkTitle">Stay Safe</div>
            </div>

            <ol className="rd-rules">
              <li>Verify pickup details before meeting.</li>
              <li>Use respectful communication.</li>
              <li>Choose safe public locations when possible.</li>
            </ol>

            <a
              className="rd-darkLink"
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
    <div className="rd-statCard">
      <div className="rd-statTop">
        <div className="rd-statLabel">{label}</div>
        <div className="rd-statIcon">{icon}</div>
      </div>
      <div className="rd-statValue">{value}</div>
      <div className="rd-statSub">{sub}</div>
    </div>
  );
}

function RequestCard({ item }: RequestCardProps): JSX.Element {
  return (
    <div className="rd-listCard">
      <div className="rd-listMedia">
        <img src={item.image} alt={item.title} />
        <div className="rd-chip">{item.status}</div>
      </div>

      <div className="rd-listBody">
        <div className="rd-listTitleRow">
          <div className="rd-listTitle">{item.title}</div>
          <div className="rd-listTime">{item.time}</div>
        </div>

        <div className="rd-listDesc">{item.desc}</div>

        <div className="rd-listFooter">
          {item.location && (
            <div className="rd-metric">
              <span className="rd-metricIco">📍</span> {item.location}
            </div>
          )}

          {item.donorName && <div className="rd-note">👤 {item.donorName}</div>}

          <div className="rd-actions">
            <button className="rd-ctaBtn">View Details</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, text }: EmptyStateProps): JSX.Element {
  return (
    <div className="rd-empty">
      <div className="rd-emptyTitle">{title}</div>
      <div className="rd-emptyText">{text}</div>
    </div>
  );
}