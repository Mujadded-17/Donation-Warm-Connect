import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../../styles/receiverDashboard.css";
import { Link } from "react-router-dom";
import ChatPanel from "../chat/ChatPanel";

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

type MenuKey = "dashboard" | "browse" | "requests" | "messages";
type TabKey = "matched" | "saved" | "community" | "messages";

type Item = {
  item_id?: number;
  title?: string;
  description?: string;
  images?: string;
  status?: string;
  delivery_available?: number | string;
  pickup_location?: string;
  donor_id?: number;
  category_id?: number;
  post_date?: string;
};

type StatCardProps = {
  label: string;
  value: string;
  sub: string;
  icon: string;
};

type RequestCardProps = {
  item: Item;
};

type EmptyStateProps = {
  title: string;
  text: string;
};

export default function ReceiverDashboard(): JSX.Element {
  const rawUser = localStorage.getItem("user");
  const storedUser: User | null = rawUser ? JSON.parse(rawUser) : null;

  const [user, setUser] = useState<User | null>(storedUser);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [activeMenu, setActiveMenu] = useState<MenuKey>("dashboard");
  const [activeTab, setActiveTab] = useState<TabKey>("matched");
  
  // Search state - ONLY affects items list
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"title" | "location">("title");

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [itemError, setItemError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (storedUser?.user_id) {
        try {
          setLoadingProfile(true);
          const token = localStorage.getItem("token") || "";
          
          const profileRes = await axios.get(`${API}/profile/${storedUser.user_id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          });
          
          if (profileRes.data?.success) {
            const profileUser = profileRes.data.user as User;
            setUser(profileUser);
            localStorage.setItem("user", JSON.stringify(profileUser));
          } else {
            setProfileError("Could not load profile.");
          }
        } catch (error) {
          console.error("Failed to fetch receiver profile:", error);
          setProfileError("Failed to load profile.");
        } finally {
          setLoadingProfile(false);
        }
      } else {
        setLoadingProfile(false);
      }

      try {
        setLoadingItems(true);
        const itemRes = await axios.get(`${API}/items`);

        if (Array.isArray(itemRes.data)) {
          setItems(itemRes.data);
          setFilteredItems(itemRes.data);
        } else {
          setItems([]);
          setFilteredItems([]);
        }
      } catch (error) {
        console.error("Failed to fetch approved items:", error);
        setItemError("Failed to load available items.");
        setItems([]);
        setFilteredItems([]);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchData();
  }, []);

  // Search functionality - ONLY filters the items list, nothing else
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(items);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = items.filter((item) => {
      if (searchType === "title") {
        return item.title?.toLowerCase().includes(term);
      } else {
        return item.pickup_location?.toLowerCase().includes(term);
      }
    });
    setFilteredItems(filtered);
  }, [searchTerm, searchType, items]);

  const displayName = user?.name || user?.email?.split("@")?.[0] || "Receiver";

  const roleLabel = useMemo(() => {
    const t = (user?.user_type || "receiver").toLowerCase();
    if (t === "receiver") return "COMMUNITY MEMBER";
    if (t === "donor") return "KINDNESS ADVOCATE";
    return "ADMIN";
  }, [user]);

  const initials = useMemo(() => {
    return displayName
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [displayName]);

  // Stats based on ALL items (original data) - NOT affected by search
  const allItemsStats = useMemo(() => {
    const totalApproved = items.length;
    const deliveryAvailable = items.filter(
      (item) =>
        String(item.delivery_available) === "1" ||
        String(item.delivery_available).toLowerCase() === "true"
    ).length;

    const pickupOnly = totalApproved - deliveryAvailable;

    return {
      totalApproved,
      deliveryAvailable,
      pickupOnly,
    };
  }, [items]);

  const isLoading = loadingProfile || loadingItems;

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="rd">
      <aside className="rd-sidebar">
        <div className="rd-brand">
          <span className="rd-brandMark" />
          <span className="rd-brandText">warmConnect</span>
        </div>

        <div className="rd-profile">
          <div className="rd-avatar">
            {user?.profile_url ? (
              <img
                src={user.profile_url}
                alt={displayName}
                className="rd-avatarImg"
              />
            ) : (
              <div className="rd-avatarFallback">{initials}</div>
            )}
          </div>

          <div className="rd-profileMeta">
            <div className="rd-profileName">{displayName}</div>
            <div className="rd-profileRole">{roleLabel}</div>
            <div className="rd-profileEmail">{user?.email || "No email"}</div>
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

          <Link
            to="/explore"
            className={`rd-navItem ${activeMenu === "browse" ? "isActive" : ""}`}
            onClick={() => setActiveMenu("browse")}
          >
            <span className="rd-ico">⌕</span>
            Browse Gifts
          </Link>

          <button
            className={`rd-navItem ${activeMenu === "requests" ? "isActive" : ""}`}
            onClick={() => setActiveMenu("requests")}
          >
            <span className="rd-ico">♡</span>
            My Requests
          </button>

          <button
            className={`rd-navItem ${activeMenu === "messages" ? "isActive" : ""}`}
            onClick={() => {
              setActiveMenu("messages");
              setActiveTab("messages");
            }}
          >
            <span className="rd-ico">✉</span>
            Messages
          </button>

          <Link to="/profile" className="rd-navItem">
            <span className="rd-ico">👤</span>
            My Profile
          </Link>
        </nav>

        <div className="rd-sidebarBottom">
          <Link to="/explore" className="rd-createBtn">
            <span className="rd-plus">＋</span> Browse Support
          </Link>
          <div className="rd-help">
            <span className="rd-helpIco">?</span> How warmConnect works
          </div>
        </div>
      </aside>

      <main className="rd-main">
        <header className="rd-topbar">
          <div className="rd-topLinks">
            <Link to="/" className="rd-topLink">
              Home
            </Link>
            <Link to="/explore" className="rd-topLink">
              Explore
            </Link>
            <span className="rd-topLink">Stories</span>
          </div>

          <div className="rd-topRight">
            <div className="rd-search">
              <span className="rd-searchIco">🔎</span>
              <input 
                placeholder="Search by title or location..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={clearSearch}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    marginLeft: '5px',
                    fontSize: '16px'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            <select 
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as "title" | "location")}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginLeft: '10px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="title">Search by Title</option>
              <option value="location">Search by Location</option>
            </select>

            <button className="rd-iconBtn" aria-label="Notifications">
              🔔
            </button>

            <Link to="/profile" className="rd-iconBtn" aria-label="Profile">
              👤
            </Link>

            <div className="rd-miniAvatar" title={displayName}>
              {user?.profile_url ? (
                <img
                  src={user.profile_url}
                  alt={displayName}
                  className="rd-miniAvatarImg"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          </div>
        </header>

        <section className="rd-greet">
          <h1>
            Welcome <span className="rd-nameAccent">{displayName}!</span>
          </h1>
          <p>
            Browse real approved donations from{" "}
            <span className="rd-accent">warmConnect</span>.
          </p>
          {searchTerm && (
            <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
              Showing {filteredItems.length} of {items.length} total items matching "{searchTerm}" in {searchType}
            </p>
          )}
        </section>

        {(profileError || itemError) && (
          <div className="rd-empty" style={{ marginBottom: "16px" }}>
            <div className="rd-emptyTitle">Some data could not be loaded</div>
            <div className="rd-emptyText">
              {[profileError, itemError].filter(Boolean).join(" ")}
            </div>
          </div>
        )}

        <section className="rd-stats">
          <StatCard
            label="AVAILABLE ITEMS"
            value={`${allItemsStats.totalApproved}`}
            sub="Total items in community"
            icon="🎁"
          />
          <StatCard
            label="DELIVERY AVAILABLE"
            value={`${allItemsStats.deliveryAvailable}`}
            sub="Items offering delivery"
            icon="🚚"
          />
          <StatCard
            label="PICKUP ITEMS"
            value={`${allItemsStats.pickupOnly}`}
            sub="Items requiring pickup"
            icon="📍"
          />
        </section>

        <section className="rd-panel">
          <div className="rd-tabs">
            <button
              className={`rd-tab ${activeTab === "matched" ? "isActive" : ""}`}
              onClick={() => setActiveTab("matched")}
            >
              Available Offers
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
            <button
              className={`rd-tab ${activeTab === "messages" ? "isActive" : ""}`}
              onClick={() => {
                setActiveTab("messages");
                setActiveMenu("messages");
              }}
            >
              Messages
            </button>

            <div className="rd-tabsRight">
              <button className="rd-sortBtn">
                <span className="rd-sortIco">≡</span> Approved items
              </button>
            </div>
          </div>

          <div className="rd-listGrid">
            {isLoading ? (
              <EmptyState
                title="Loading data..."
                text="Please wait while your receiver dashboard is fetched."
              />
            ) : activeTab === "matched" ? (
              filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <RequestCard key={item.item_id} item={item} />
                ))
              ) : (
                <EmptyState
                  title={searchTerm ? "No matching items found" : "No approved items found"}
                  text={searchTerm ? `No items match "${searchTerm}" in ${searchType}. Try a different search term.` : "There are currently no approved items available in the backend."}
                />
              )
            ) : activeTab === "saved" ? (
              <EmptyState
                title="No saved items endpoint available"
                text="This section remains empty until a real saved items backend feature is added."
              />
            ) : activeTab === "messages" ? (
              <ChatPanel currentUser={user} apiBase={API} />
            ) : (
              <EmptyState
                title="No community endpoint available"
                text="This section remains empty until a real community backend feature is added."
              />
            )}
          </div>
        </section>

        <section className="rd-bottomGrid">
          <div className="rd-box">
            <div className="rd-boxHead">
              <div>
                <div className="rd-boxTitle">Receiver Summary</div>
                <div className="rd-boxSub">
                  Real data from your profile and approved item listings.
                </div>
              </div>
              <button className="rd-mapBtn" aria-label="Summary">
                📄
              </button>
            </div>

            <div className="rd-mapMock">
              <div className="rd-mapPill">
                {user?.name || "No name"} | Total available: {allItemsStats.totalApproved} items
              </div>
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
  const title = item.title || "Untitled Item";
  const desc = item.description || "No description provided.";
  const image = item.images || "https://via.placeholder.com/600x400?text=No+Image";
  const location = item.pickup_location || "Location not provided";
  const time = formatRelativeTime(item.post_date || "");
  const deliveryAvailable =
    String(item.delivery_available) === "1" ||
    String(item.delivery_available).toLowerCase() === "true";

  return (
    <div className="rd-listCard">
      <div className="rd-listMedia">
        <img src={image} alt={title} />
        <div className="rd-chip">{String(item.status || "approved").toUpperCase()}</div>
      </div>

      <div className="rd-listBody">
        <div className="rd-listTitleRow">
          <div className="rd-listTitle">{title}</div>
          <div className="rd-listTime">{time}</div>
        </div>

        <div className="rd-listDesc">{desc}</div>

        <div className="rd-listFooter">
          <div className="rd-metric">
            <span className="rd-metricIco">📍</span> {location}
          </div>

          <div className="rd-note">
            {deliveryAvailable ? "🚚 Delivery Available" : "🏠 Pickup Only"}
          </div>

          <div className="rd-actions">
            <Link to="/explore" className="rd-ctaBtn">
              View More
            </Link>
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