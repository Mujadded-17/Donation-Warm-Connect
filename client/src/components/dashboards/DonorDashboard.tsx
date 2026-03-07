import { useMemo, useState } from "react";
import "../../styles/donorDashboard.css";

type User = {
  name?: string;
  email?: string;
  user_type?: string;
};

type MenuKey = "dashboard" | "offer" | "impact" | "inbox";
type TabKey = "donations" | "requests" | "community";
type DonationSubTabKey = "active" | "past";

type ListingItem = {
  id: number;
  status: string;
  title: string;
  time: string;
  desc: string;
  responses?: number;
  views?: number;
  note?: string;
  cta?: string;
  image: string;
};

type StatCardProps = {
  label: string;
  value: string;
  sub: string;
  icon: string;
};

type ListingCardProps = {
  item: ListingItem;
};

type EmptyStateProps = {
  title: string;
  text: string;
};

export default function DonorDashboard(): JSX.Element {
  const rawUser = localStorage.getItem("user");
  const user: User | null = rawUser ? JSON.parse(rawUser) : null;

  const [activeMenu, setActiveMenu] = useState<MenuKey>("dashboard");
  const [activeTab, setActiveTab] = useState<TabKey>("donations");
  const [donationSubTab, setDonationSubTab] =
    useState<DonationSubTabKey>("active");

  const displayName = user?.name || user?.email?.split("@")?.[0] || "Alex";

  const roleLabel = useMemo(() => {
    const t = (user?.user_type || "donor").toLowerCase();
    if (t === "donor") return "KINDNESS ADVOCATE";
    if (t === "receiver") return "COMMUNITY MEMBER";
    return "ADMIN";
  }, [user]);

  const stats = {
    warmthShared: 24,
    localConnections: 210,
    neighborsHelped: 12,
    kindnessSpark: 950,
    topLabel: "Top 5% Giver",
  };

  const activeListings: ListingItem[] = [
    {
      id: 1,
      status: "AVAILABLE",
      title: "Wooden Dining Table",
      time: "2h ago",
      desc: "Solid oak table in great condition. Fits 6 people. Pickup near Green Park. Hoping it finds a good home!",
      responses: 3,
      views: 12,
      image:
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&h=800&fit=crop",
    },
    {
      id: 2,
      status: "FINDING PICKUP",
      title: "Kids Book Collection",
      time: "Yesterday",
      desc: "Box of 15 picture books for ages 3–7. Various classics and modern stories.",
      note: "Promised to Sarah J.",
      cta: "Complete Gift",
      image:
        "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&h=800&fit=crop",
    },
  ];

  return (
    <div className="dd">
      <aside className="dd-sidebar">
        <div className="dd-brand">
          <span className="dd-brandMark" />
          <span className="dd-brandText">warmConnect</span>
        </div>

        <div className="dd-profile">
          <div className="dd-avatar">
            <span className="dd-avatarInner" />
          </div>
          <div className="dd-profileMeta">
            <div className="dd-profileName">{displayName}</div>
            <div className="dd-profileRole">{roleLabel}</div>
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

          <button
            className={`dd-navItem ${activeMenu === "offer" ? "isActive" : ""}`}
            onClick={() => setActiveMenu("offer")}
          >
            <span className="dd-ico">✦</span>
            Offer a Gift
          </button>

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
            <span className="dd-badge">3</span>
          </button>
        </nav>

        <div className="dd-sidebarBottom">
          <button className="dd-createBtn">
            <span className="dd-plus">＋</span> Create New
          </button>
          <div className="dd-help">
            <span className="dd-helpIco">?</span> How warmConnect works
          </div>
        </div>
      </aside>

      <main className="dd-main">
        <header className="dd-topbar">
          <div className="dd-topLinks">
            <span className="dd-topLink">Home</span>
            <span className="dd-topLink">Explore</span>
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
            <button className="dd-iconBtn" aria-label="Settings">
              ⚙️
            </button>
            <div className="dd-miniAvatar" title={displayName}>
              <span />
            </div>
          </div>
        </header>

        <section className="dd-greet">
          <h1>
            Hello <span className="dd-nameAccent">{displayName}!</span>
          </h1>
          <p>
            Welcome back to <span className="dd-accent">warmConnect</span>. Ready
            to brighten someone&apos;s day today?
          </p>
        </section>

        <section className="dd-stats">
          <StatCard
            label="WARMTH SHARED"
            value={`${stats.warmthShared} Items`}
            sub={`+${stats.localConnections} local connections`}
            icon="💡"
          />
          <StatCard
            label="NEIGHBORS HELPED"
            value={`${stats.neighborsHelped}`}
            sub="Spreading kindness"
            icon="👥"
          />
          <StatCard
            label="KINDNESS SPARK"
            value={`${stats.kindnessSpark}`}
            sub={stats.topLabel}
            icon="✨"
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
            {activeTab === "donations" ? (
              activeListings.map((item) => (
                <ListingCard key={item.id} item={item} />
              ))
            ) : (
              <EmptyState
                title="Nothing here yet"
                text="This section will show data when you connect it to your backend."
              />
            )}
          </div>
        </section>

        <section className="dd-bottomGrid">
          <div className="dd-box">
            <div className="dd-boxHead">
              <div>
                <div className="dd-boxTitle">Your Local Impact Map</div>
                <div className="dd-boxSub">
                  See the warmth spreading through your neighborhood.
                </div>
              </div>
              <button className="dd-mapBtn" aria-label="Map">
                🗺️
              </button>
            </div>

            <div className="dd-mapMock">
              <div className="dd-mapPin" />
              <div className="dd-mapPill">Active Sharing Area</div>
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
  return (
    <div className="dd-listCard">
      <div className="dd-listMedia">
        <img src={item.image} alt={item.title} />
        <div className="dd-chip">{item.status}</div>
      </div>

      <div className="dd-listBody">
        <div className="dd-listTitleRow">
          <div className="dd-listTitle">{item.title}</div>
          <div className="dd-listTime">{item.time}</div>
        </div>

        <div className="dd-listDesc">{item.desc}</div>

        <div className="dd-listFooter">
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

          {item.note && <div className="dd-note">🏷️ {item.note}</div>}

          <div className="dd-actions">
            {item.cta ? (
              <button className="dd-ctaBtn">{item.cta}</button>
            ) : (
              <button className="dd-ghostBtn" aria-label="Edit">
                ✎
              </button>
            )}
          </div>
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