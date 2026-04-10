import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../../styles/donorDashboard.css";
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

type MenuKey = "dashboard" | "offer" | "impact" | "inbox";
type TabKey = "donations" | "requests" | "messages" | "community";
type DonationSubTabKey = "active" | "past";

type IncomingRequest = {
  donation_id: number;
  item_id: number;
  donor_id: number;
  receiver_id: number;
  donation_status: string;
  request_date?: string;
  item_title?: string;
  pickup_location?: string;
  receiver_name?: string;
  receiver_email?: string;
  receiver_phone?: string;
  receiver_address?: string;
  receiver_profile_url?: string | null;
};

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
  pickup_location?: string;
};

type StatCardProps = {
  label: string;
  value: string;
  sub: string;
  icon: string;
};

type ListingCardProps = {
  item: any;
};

type EmptyStateProps = {
  title: string;
  text: string;
};

type RequestNotificationCardProps = {
  request: IncomingRequest;
  isUpdating: boolean;
  onApprove: () => void;
  onReject: () => void;
};

type NotificationItem = {
  notify_id?: number;
  type?: string;
  message?: string;
  create_time?: string;
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
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [donationError, setDonationError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>(
    []
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [actioningRequestId, setActioningRequestId] = useState<number | null>(
    null
  );

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"title" | "location" | "receiver">("title");
  const [filteredDonations, setFilteredDonations] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<IncomingRequest[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!storedUser?.user_id) {
        setLoadingProfile(false);
        setLoadingDonations(false);
        setLoadingRequests(false);
        setLoadingNotifications(false);
        return;
      }

      const token = localStorage.getItem("token") || "";
      const authHeaders = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      try {
        setLoadingProfile(true);
        const profileRes = await axios.get(`${API}/profile/${storedUser.user_id}`, {
          headers: authHeaders,
        });

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
          `${API}/user/donations/${storedUser.user_id}`,
          {
            headers: authHeaders,
          }
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

      try {
        setLoadingRequests(true);
        const requestRes = await axios.get(
          `${API}/donations/incoming/${storedUser.user_id}`,
          {
            headers: authHeaders,
          }
        );

        const payload = requestRes.data?.requests;
        const requests = Array.isArray(payload) ? payload : [];
        setIncomingRequests(requests);
        setFilteredRequests(requests);
      } catch (error) {
        console.error("Incoming request fetch failed:", error);
        setRequestError("Failed to load request notifications.");
        setIncomingRequests([]);
        setFilteredRequests([]);
      } finally {
        setLoadingRequests(false);
      }

      try {
        setLoadingNotifications(true);
        const notificationRes = await axios.get(
          `${API}/notifications/${storedUser.user_id}`,
          {
            headers: authHeaders,
          }
        );
        const payload = notificationRes.data;
        setNotifications(Array.isArray(payload) ? payload : []);
      } catch (error) {
        console.error("Notification fetch failed:", error);
        setNotifications([]);
      } finally {
        setLoadingNotifications(false);
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
        _pickup_location: item.pickup_location || "Location not specified",
      };
    });
  }, [donations]);

  // Search functionality for DONATIONS
  useEffect(() => {
    if (!searchTerm.trim() || activeTab !== "donations") {
      setFilteredDonations(normalizedDonations);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = normalizedDonations.filter((item: any) => {
      if (searchType === "title") {
        return item._title?.toLowerCase().includes(term);
      } else if (searchType === "location") {
        return item._pickup_location?.toLowerCase().includes(term);
      }
      return true;
    });
    setFilteredDonations(filtered);
  }, [searchTerm, searchType, normalizedDonations, activeTab]);

  // Search functionality for REQUESTS
  useEffect(() => {
    if (!searchTerm.trim() || activeTab !== "requests") {
      setFilteredRequests(incomingRequests);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = incomingRequests.filter((request) => {
      if (searchType === "title") {
        return request.item_title?.toLowerCase().includes(term);
      } else if (searchType === "receiver") {
        return request.receiver_name?.toLowerCase().includes(term) ||
               request.receiver_email?.toLowerCase().includes(term);
      }
      return true;
    });
    setFilteredRequests(filtered);
  }, [searchTerm, searchType, incomingRequests, activeTab]);

  const activeListings = useMemo(() => {
    return filteredDonations.filter(
      (item: any) =>
        item._status !== "completed" &&
        item._status !== "received" &&
        item._status !== "delivered"
    );
  }, [filteredDonations]);

  const pastListings = useMemo(() => {
    return filteredDonations.filter(
      (item: any) =>
        item._status === "completed" ||
        item._status === "received" ||
        item._status === "delivered"
    );
  }, [filteredDonations]);

  const shownListings =
    donationSubTab === "active" ? activeListings : pastListings;

  const stats = useMemo(() => {
    const total = normalizedDonations.length;
    const active = activeListings.length;
    const completed = pastListings.length;
    const pendingRequests = incomingRequests.filter(
      (request) =>
        String(request.donation_status || "").toLowerCase() === "requested"
    ).length;
    const unreadNotifications = notifications.filter(
      (item) => String(item.type || "").toLowerCase() === "item_request"
    ).length;

    return {
      totalDonations: total,
      activeDonations: active,
      completedDonations: completed,
      pendingRequests,
      unreadNotifications,
    };
  }, [
    normalizedDonations,
    activeListings,
    pastListings,
    incomingRequests,
    notifications,
  ]);

  const handleRequestDecision = async (
    donationId: number,
    status: "approved" | "rejected"
  ) => {
    const token = localStorage.getItem("token") || "";

    try {
      setActioningRequestId(donationId);

      await axios.put(
        `${API}/donations/${donationId}/decision`,
        { status },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIncomingRequests((prev) =>
        prev.map((request) =>
          request.donation_id === donationId
            ? { ...request, donation_status: status }
            : request
        )
      );
      setFilteredRequests((prev) =>
        prev.map((request) =>
          request.donation_id === donationId
            ? { ...request, donation_status: status }
            : request
        )
      );
    } catch (error) {
      console.error("Failed to update request decision:", error);
      alert("Failed to update request decision.");
    } finally {
      setActioningRequestId(null);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  // Get search placeholder based on active tab
  const getSearchPlaceholder = () => {
    if (activeTab === "donations") {
      return "Search your donations...";
    } else if (activeTab === "requests") {
      return "Search requests...";
    } else {
      return "Search...";
    }
  };

  // Get search options based on active tab
  const getSearchOptions = () => {
    if (activeTab === "donations") {
      return (
        <>
          <option value="title">By Item Title</option>
          <option value="location">By Pickup Location</option>
        </>
      );
    } else if (activeTab === "requests") {
      return (
        <>
          <option value="title">By Item Title</option>
          <option value="receiver">By Receiver Name</option>
        </>
      );
    } else {
      return <option value="title">Search</option>;
    }
  };

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
            onClick={() => {
              setActiveMenu("inbox");
              setActiveTab("requests");
            }}
          >
            <span className="dd-ico">✉</span>
            Inbox
              {stats.unreadNotifications > 0 && (
                <span className="dd-badge">{stats.unreadNotifications}</span>
              )}
          </button>

          <button
            className={`dd-navItem ${activeMenu === "impact" && activeTab === "messages" ? "isActive" : ""}`}
            onClick={() => {
              setActiveMenu("impact");
              setActiveTab("messages");
            }}
          >
            <span className="dd-ico">💬</span>
            Messages
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
              <input 
                placeholder={getSearchPlaceholder()} 
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

            {/* Dynamic Search Type Dropdown */}
            <select 
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as "title" | "location" | "receiver")}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginLeft: '10px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              {getSearchOptions()}
            </select>

            <button
              className="dd-notificationBtn"
              aria-label="Notifications"
              onClick={() => {
                setActiveMenu("inbox");
                setActiveTab("requests");
              }}
              type="button"
            >
              <span>🔔</span>
              <span>Notifications</span>
              {stats.unreadNotifications > 0 && (
                <span className="dd-notificationCount">{stats.unreadNotifications}</span>
              )}
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
          {searchTerm && (
            <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
              {activeTab === "donations" && (
                <>Showing {shownListings.length} of {activeTab === "donations" ? normalizedDonations.length : 0} donations matching "{searchTerm}"</>
              )}
              {activeTab === "requests" && (
                <>Showing {filteredRequests.length} of {incomingRequests.length} requests matching "{searchTerm}"</>
              )}
            </p>
          )}
        </section>

        {(profileError || donationError || requestError) && (
          <div className="dd-empty" style={{ marginBottom: "16px" }}>
            <div className="dd-emptyTitle">Some data could not be loaded</div>
            <div className="dd-emptyText">
              {[profileError, donationError, requestError].filter(Boolean).join(" ")}
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
          <StatCard
            label="PENDING REQUESTS"
            value={`${stats.pendingRequests}`}
            sub="Need your approval"
            icon="✉"
          />
        </section>

        <section className="dd-panel">
          <div className="dd-tabs">
            <button
              className={`dd-tab ${activeTab === "donations" ? "isActive" : ""}`}
              onClick={() => {
                setActiveTab("donations");
                setSearchTerm(""); // Clear search when switching tabs
              }}
            >
              My Donations
            </button>
            <button
              className={`dd-tab ${activeTab === "requests" ? "isActive" : ""}`}
              onClick={() => {
                setActiveTab("requests");
                setActiveMenu("inbox");
                setSearchTerm(""); // Clear search when switching tabs
              }}
            >
              My Requests
            </button>
            <button
              className={`dd-tab ${activeTab === "community" ? "isActive" : ""}`}
              onClick={() => setActiveTab("community")}
            >
              My Community
            </button>
            <button
              className={`dd-tab ${activeTab === "messages" ? "isActive" : ""}`}
              onClick={() => {
                setActiveTab("messages");
                setActiveMenu("impact");
              }}
            >
              Messages
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
                      ? searchTerm ? "No matching active donations found" : "No active donations found"
                      : searchTerm ? "No matching past donations found" : "No past donations found"
                  }
                  text={
                    donationSubTab === "active"
                      ? searchTerm ? `No donations match "${searchTerm}" in ${searchType}` : "You haven't posted any active donations yet."
                      : searchTerm ? `No past donations match "${searchTerm}" in ${searchType}` : "No completed donations yet."
                  }
                />
              )
            ) : activeTab === "requests" ? (
              loadingRequests ? (
                <EmptyState
                  title="Loading request notifications..."
                  text="Please wait while incoming requests are fetched."
                />
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <RequestNotificationCard
                    key={request.donation_id}
                    request={request}
                    isUpdating={actioningRequestId === request.donation_id}
                    onApprove={() =>
                      handleRequestDecision(request.donation_id, "approved")
                    }
                    onReject={() =>
                      handleRequestDecision(request.donation_id, "rejected")
                    }
                  />
                ))
              ) : loadingNotifications ? (
                <EmptyState
                  title="Loading notifications..."
                  text="Fetching donor notifications from server."
                />
              ) : searchTerm ? (
                <EmptyState
                  title="No matching requests found"
                  text={`No requests match "${searchTerm}" in ${searchType}`}
                />
              ) : (
                <EmptyState
                  title="No incoming requests"
                  text="When a receiver requests your item, details will appear here."
                />
              )
            ) : activeTab === "messages" ? (
              <ChatPanel currentUser={user} apiBase={API} />
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
  const title = item._title;
  const desc = item._desc;
  const image = item._image;
  const status = item._status;
  const time = item._time;
  const location = item._pickup_location;

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
          {location && location !== "Location not specified" && (
            <div className="dd-metric">
              <span className="dd-metricIco">📍</span> {location}
            </div>
          )}

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

function RequestNotificationCard({
  request,
  isUpdating,
  onApprove,
  onReject,
}: RequestNotificationCardProps): JSX.Element {
  const status = String(request.donation_status || "requested").toLowerCase();
  const statusLabel = status.toUpperCase();
  const canDecide = status === "requested";

  return (
    <div className="dd-requestCard">
      <div className="dd-requestHead">
        <div>
          <div className="dd-requestTitle">
            {request.receiver_name || "A receiver"} requested{" "}
            {request.item_title || "your item"}
          </div>
          <div className="dd-requestTime">
            {formatRelativeTime(request.request_date || "")}
          </div>
        </div>
        <div className={`dd-requestStatus is-${status}`}>{statusLabel}</div>
      </div>

      <div className="dd-requestDetails">
        <div>
          <strong>Receiver:</strong> {request.receiver_name || "N/A"}
        </div>
        <div>
          <strong>Email:</strong> {request.receiver_email || "N/A"}
        </div>
        <div>
          <strong>Phone:</strong> {request.receiver_phone || "Not provided"}
        </div>
        <div>
          <strong>Address:</strong> {request.receiver_address || "Not provided"}
        </div>
        <div>
          <strong>Pickup:</strong> {request.pickup_location || "Not specified"}
        </div>
      </div>

      {canDecide && (
        <div className="dd-requestActions">
          <button
            type="button"
            className="dd-requestApprove"
            disabled={isUpdating}
            onClick={onApprove}
          >
            {isUpdating ? "Updating..." : "Permit"}
          </button>
          <button
            type="button"
            className="dd-requestReject"
            disabled={isUpdating}
            onClick={onReject}
          >
            Reject
          </button>
        </div>
      )}
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