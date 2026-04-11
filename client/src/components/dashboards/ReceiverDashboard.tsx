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

type SavedItem = {
  saved_id: number;
  item_id: number;
  title: string;
  description: string;
  images: string;
  pickup_location: string;
  delivery_available: number | string;
  post_date: string;
  donor_id: number;
  donor_name: string;
  saved_at: string;
};

type RequestedItem = {
  donation_id: number;
  item_id: number;
  title: string;
  description: string;
  images: string;
  pickup_location: string;
  donor_name: string;
  donor_id: number;
  request_date: string;
  donation_status: string;
};

type StatCardProps = {
  label: string;
  value: string;
  sub: string;
  icon: string;
};

type RequestCardProps = {
  item: Item | SavedItem;
  isSaved?: boolean;
  isSaving?: boolean;
  onSave?: () => void;
  onUnsave?: () => void;
  showSaveButton?: boolean;
};

type EmptyStateProps = {
  title: string;
  text: string;
};

// Community types
type TopDonor = {
  user_id: number;
  name: string;
  profile_url: string | null;
  donation_count: number;
  rank: number;
};

export default function ReceiverDashboard(): JSX.Element {
  const rawUser = localStorage.getItem("user");
  const storedUser: User | null = rawUser ? JSON.parse(rawUser) : null;

  const [user, setUser] = useState<User | null>(storedUser);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [savedItemIds, setSavedItemIds] = useState<Set<number>>(new Set());
  const [requestedItems, setRequestedItems] = useState<RequestedItem[]>([]);
  const [activeMenu, setActiveMenu] = useState<MenuKey>("dashboard");
  const [activeTab, setActiveTab] = useState<TabKey>("matched");
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"title" | "location">("title");

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [itemError, setItemError] = useState("");

  // Community state
  const [topDonors, setTopDonors] = useState<TopDonor[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState("");
  const [thankYouTo, setThankYouTo] = useState("");
  const [thankYouItem, setThankYouItem] = useState("");
  const [selectedDonor, setSelectedDonor] = useState<number | null>(null);

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

      // Fetch saved items and requested items
      if (storedUser?.user_id) {
        await fetchSavedItems();
        await fetchRequestedItems();
      }
    };

    fetchData();
  }, []);

  // Fetch community data when community tab is active
  useEffect(() => {
    if (activeTab === "community") {
      fetchCommunityData();
    }
  }, [activeTab]);

  const fetchSavedItems = async () => {
    if (!storedUser?.user_id) return;
    
    setLoadingSaved(true);
    const token = localStorage.getItem("token") || "";
    
    try {
      const response = await axios.get(`${API}/saved-items/${storedUser.user_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      
      if (Array.isArray(response.data)) {
        setSavedItems(response.data);
        const ids = new Set(response.data.map((item: SavedItem) => item.item_id));
        setSavedItemIds(ids);
      }
    } catch (error) {
      console.error("Failed to fetch saved items:", error);
    } finally {
      setLoadingSaved(false);
    }
  };

  const fetchRequestedItems = async () => {
    if (!storedUser?.user_id) return;
    
    setLoadingRequests(true);
    const token = localStorage.getItem("token") || "";
    
    try {
      const response = await axios.get(`${API}/receiver/requests/${storedUser.user_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      
      console.log("Requested items response:", response.data);
      
      if (response.data?.success && Array.isArray(response.data.requests)) {
        setRequestedItems(response.data.requests);
      }
    } catch (error) {
      console.error("Failed to fetch requested items:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSaveItem = async (itemId: number) => {
    if (!storedUser?.user_id) {
      alert("Please login to save items");
      return;
    }

    setSavingId(itemId);
    const token = localStorage.getItem("token") || "";

    try {
      await axios.post(
        `${API}/saved-items`,
        {
          user_id: storedUser.user_id,
          item_id: itemId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      await fetchSavedItems();
      alert("Item saved successfully!");
    } catch (error: any) {
      console.error("Failed to save item:", error);
      if (error.response?.status === 409) {
        alert("Item already saved!");
      } else {
        alert("Failed to save item");
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleUnsaveItem = async (itemId: number) => {
    setSavingId(itemId);
    const token = localStorage.getItem("token") || "";

    try {
      await axios.delete(`${API}/saved-items/${itemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await fetchSavedItems();
      alert("Item removed from saved!");
    } catch (error) {
      console.error("Failed to unsave item:", error);
      alert("Failed to remove saved item");
    } finally {
      setSavingId(null);
    }
  };

  const cancelRequest = async (donationId: number) => {
    if (!confirm("Are you sure you want to cancel this request?")) return;
    
    const token = localStorage.getItem("token") || "";
    
    try {
      await axios.delete(`${API}/receiver/requests/${donationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      alert("Request cancelled successfully!");
      await fetchRequestedItems();
    } catch (error) {
      console.error("Failed to cancel request:", error);
      alert("Failed to cancel request");
    }
  };

  const fetchCommunityData = async () => {
    setLoadingCommunity(true);
    try {
      const [donorsRes] = await Promise.all([
        axios.get(`${API}/community/top-donors`),
      ]);
      
      setTopDonors(donorsRes.data.data || []);
    } catch (error) {
      console.error("Failed to fetch community data:", error);
    } finally {
      setLoadingCommunity(false);
    }
  };

  const handleSendThankYou = async () => {
    if (!thankYouMessage.trim()) {
      alert("Please enter a thank you message");
      return;
    }

    const token = localStorage.getItem("token") || "";
    
    try {
      await axios.post(
        `${API}/community/thank-you`,
        {
          to_user_id: selectedDonor,
          message: thankYouMessage,
          item_title: thankYouItem || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      alert("✅ Thank you message sent to donor!");
      
      setShowThankYouModal(false);
      setThankYouMessage("");
      setThankYouTo("");
      setThankYouItem("");
      setSelectedDonor(null);
    } catch (error) {
      console.error("Failed to send thank you:", error);
      alert("Failed to send thank you message");
    }
  };

  // Search functionality
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

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return '✓ Approved';
      case 'rejected':
        return '✗ Rejected';
      default:
        return '⏳ Pending';
    }
  };

  // Render My Requests content
  const renderMyRequests = () => {
    if (loadingRequests) {
      return (
        <div className="rd-loading-state">
          <p>Loading your requests...</p>
        </div>
      );
    }

    if (requestedItems.length === 0) {
      return (
        <div className="rd-empty-requests">
          <div className="rd-empty-icon">📭</div>
          <h3>No requests yet</h3>
          <p>You haven't requested any items yet. Browse available donations and make your first request!</p>
          <Link to="/explore" className="rd-browse-btn">Browse Donations</Link>
        </div>
      );
    }

    return (
      <div className="rd-requests-grid">
        {requestedItems.map((request) => (
          <div key={request.donation_id} className="rd-request-card">
            <div className="rd-request-image">
              {request.images ? (
                <img src={request.images} alt={request.title} />
              ) : (
                <div className="rd-request-image-placeholder">📦</div>
              )}
            </div>
            <div className="rd-request-content">
              <h3 className="rd-request-title">{request.title}</h3>
              <p className="rd-request-description">{request.description}</p>
              <div className="rd-request-details">
                <div className="rd-request-location">📍 {request.pickup_location}</div>
                <div className="rd-request-donor">👤 Donor: {request.donor_name}</div>
                <div className="rd-request-date">📅 Requested: {new Date(request.request_date).toLocaleDateString()}</div>
              </div>
              <div className="rd-request-status">
                <span className={`rd-status-badge ${getStatusBadgeClass(request.donation_status)}`}>
                  {getStatusText(request.donation_status)}
                </span>
                {request.donation_status === "requested" && (
                  <button 
                    className="rd-cancel-btn"
                    onClick={() => cancelRequest(request.donation_id)}
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Saved Items content
  const renderSavedItems = () => {
    if (loadingSaved) {
      return (
        <div className="rd-loading-state">
          <p>Loading saved items...</p>
        </div>
      );
    }

    if (savedItems.length === 0) {
      return (
        <div className="rd-empty-saved">
          <div className="rd-empty-icon">📌</div>
          <h3>No saved items</h3>
          <p>Save items you're interested in by clicking the bookmark icon on any donation.</p>
          <Link to="/explore" className="rd-browse-btn">Browse Donations</Link>
        </div>
      );
    }

    return (
      <div className="rd-saved-grid">
        {savedItems.map((item) => {
          const deliveryAvailable = String(item.delivery_available) === "1" || String(item.delivery_available).toLowerCase() === "true";
          
          return (
            <div key={item.saved_id} className="rd-saved-card">
              <div className="rd-saved-image">
                {item.images ? (
                  <img src={item.images} alt={item.title} />
                ) : (
                  <div className="rd-saved-image-placeholder">📦</div>
                )}
              </div>
              <div className="rd-saved-content">
                <h3 className="rd-saved-title">{item.title}</h3>
                <p className="rd-saved-description">{item.description}</p>
                <div className="rd-saved-details">
                  <div className="rd-saved-location">📍 {item.pickup_location}</div>
                  <div className="rd-saved-donor">👤 Donor: {item.donor_name}</div>
                  <div className="rd-saved-date">📅 Saved: {new Date(item.saved_at).toLocaleDateString()}</div>
                </div>
                <div className="rd-saved-footer">
                  <div className="rd-saved-note">
                    {deliveryAvailable ? "🚚 Delivery Available" : "🏠 Pickup Only"}
                  </div>
                  <button 
                    className="rd-unsave-btn"
                    onClick={() => handleUnsaveItem(item.item_id)}
                    disabled={savingId === item.item_id}
                  >
                    {savingId === item.item_id ? "Removing..." : "❤️ Saved"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
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
            {requestedItems.length > 0 && (
              <span className="rd-nav-badge">{requestedItems.length}</span>
            )}
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
            <Link to="/stories" className="rd-topLink">
              Stories
            </Link>
          </div>
          <div className="rd-topRight">
            {activeMenu !== "requests" && activeTab !== "saved" && activeTab !== "community" && (
              <>
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
              </>
            )}

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

        {activeMenu === "requests" ? (
          <>
            <section className="rd-greet">
              <h1>
                My Requests <span className="rd-nameAccent">❤️</span>
              </h1>
              <p>Track the status of items you've requested from donors</p>
            </section>
            <section className="rd-requests-container">
              {renderMyRequests()}
            </section>
          </>
        ) : (
          <>
            <section className="rd-greet">
              <h1>
                Welcome <span className="rd-nameAccent">{displayName}!</span>
              </h1>
              <p>
                Browse real approved donations from{" "}
                <span className="rd-accent">warmConnect</span>.
              </p>
              {searchTerm && activeTab !== "saved" && activeTab !== "community" && (
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
                  {savedItems.length > 0 && (
                    <span className="rd-tab-count">{savedItems.length}</span>
                  )}
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
                      <RequestCard 
                        key={item.item_id} 
                        item={item}
                        isSaved={savedItemIds.has(item.item_id!)}
                        isSaving={savingId === item.item_id}
                        onSave={() => handleSaveItem(item.item_id!)}
                        onUnsave={() => handleUnsaveItem(item.item_id!)}
                        showSaveButton={true}
                      />
                    ))
                  ) : (
                    <EmptyState
                      title={searchTerm ? "No matching items found" : "No approved items found"}
                      text={searchTerm ? `No items match "${searchTerm}" in ${searchType}. Try a different search term.` : "There are currently no approved items available in the backend."}
                    />
                  )
                ) : activeTab === "saved" ? (
                  renderSavedItems()
                ) : activeTab === "community" ? (
                  loadingCommunity ? (
                    <EmptyState title="Loading community..." text="Please wait..." />
                  ) : (
                    <div className="community-container-inline">
                      <div className="community-section">
                        <h3>🏆 Top Donors</h3>
                        <p className="community-subtitle">Thank the donors who help make our community strong!</p>
                        <div className="top-donors-list">
                          {topDonors.length === 0 ? (
                            <p>No donors yet. Be the first to receive a donation!</p>
                          ) : (
                            topDonors.map((donor) => (
                              <div key={donor.user_id} className="top-donor-item">
                                <div className="donor-rank">#{donor.rank}</div>
                                <div className="donor-avatar-small">
                                  {donor.profile_url ? (
                                    <img src={donor.profile_url} alt={donor.name} />
                                  ) : (
                                    <div className="avatar-placeholder-small">
                                      {donor.name?.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div className="donor-info-small">
                                  <div className="donor-name-small">{donor.name || "Anonymous Donor"}</div>
                                  <div className="donor-stats-small">{donor.donation_count} donations</div>
                                </div>
                                <button 
                                  className="thank-btn-small"
                                  onClick={() => {
                                    setSelectedDonor(donor.user_id);
                                    setThankYouTo(donor.name || "Donor");
                                    setShowThankYouModal(true);
                                  }}
                                >
                                  🙏 Thank Donor
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )
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
          </>
        )}
      </main>

      {/* Thank You Modal */}
      {showThankYouModal && (
        <div className="modal-overlay" onClick={() => setShowThankYouModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🙏 Send Thank You to {thankYouTo}</h3>
              <button className="modal-close" onClick={() => setShowThankYouModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Item Name (optional)</label>
                <input
                  type="text"
                  placeholder="What item are you thanking for?"
                  value={thankYouItem}
                  onChange={(e) => setThankYouItem(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Your Thank You Message *</label>
                <textarea
                  placeholder="Write your thank you message..."
                  value={thankYouMessage}
                  onChange={(e) => setThankYouMessage(e.target.value)}
                  rows={4}
                />
              </div>
              <p className="thank-you-note">Your message will appear on the donor's community gratitude wall.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowThankYouModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={handleSendThankYou}>Send Thank You</button>
            </div>
          </div>
        </div>
      )}
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

function RequestCard({ item, isSaved, isSaving, onSave, onUnsave, showSaveButton }: RequestCardProps): JSX.Element {
  const title = item.title || "Untitled Item";
  const desc = item.description || "No description provided.";
  const image = item.images || "https://via.placeholder.com/600x400?text=No+Image";
  const location = item.pickup_location || "Location not provided";
  const time = formatRelativeTime(item.post_date || "");
  const deliveryAvailable =
    String(item.delivery_available) === "1" ||
    String(item.delivery_available).toLowerCase() === "true";

  const getStatus = () => {
    if ('status' in item && item.status) {
      return String(item.status).toUpperCase();
    }
    return "APPROVED";
  };

  return (
    <div className="rd-listCard">
      <div className="rd-listMedia">
        <img src={image} alt={title} />
        <div className="rd-chip">{getStatus()}</div>
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
            {showSaveButton && (
              <button
                className={`rd-save-btn ${isSaved ? 'saved' : ''}`}
                onClick={() => isSaved ? onUnsave?.() : onSave?.()}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : (isSaved ? '❤️ Saved' : '🤍 Save')}
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