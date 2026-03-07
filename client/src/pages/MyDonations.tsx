import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/MyDonations.css";

const API = "http://127.0.0.1:8000/api";

type Item = {
  item_id: number;
  title: string;
  description: string;
  pickup_location: string;
  status: string;
  post_date: string;
  images?: string;
  category_id: number;
  donor_id: number;
};

type User = {
  user_id: number;
  email: string;
  user_type?: string;
  [key: string]: unknown;
};

type TabType = "all" | "pending" | "approved" | "rejected";

export default function MyDonations() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser) as User;
      setUser(parsedUser);
    } catch (err) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const loadItems = async () => {
      try {
        setLoading(true);
        setError("");

        const isAdmin = user.email === "silviaadmin@gmail.com";
        const endpoint = isAdmin
          ? `${API}/admin/items/pending`
          : `${API}/user/donations/${user.user_id}`;

        const response = await fetch(endpoint, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load donations (${response.status})`);
        }

        const data = (await response.json()) as Item[];
        setItems(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load donations";
        setError(message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [user]);

  const handleStatusChange = async (itemId: number, newStatus: string) => {
    try {
      const response = await fetch(`${API}/admin/items/${itemId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Refresh items
      setItems((prev) =>
        prev.map((item) =>
          item.item_id === itemId ? { ...item, status: newStatus } : item
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const getFilteredItems = () => {
    if (activeTab === "all") return items;
    return items.filter((item) => item.status === activeTab);
  };

  const getCounts = () => {
    return {
      all: items.length,
      pending: items.filter((i) => i.status === "pending").length,
      approved: items.filter((i) => i.status === "approved").length,
      rejected: items.filter((i) => i.status === "rejected").length,
    };
  };

  const isAdmin = user?.email === "silviaadmin@gmail.com";
  const filteredItems = getFilteredItems();
  const counts = getCounts();

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="my-donations-page">
      <div className="my-donations-container">
        <div className="my-donations-header">
          <div>
            <h1 className="my-donations-title">
              {isAdmin ? "Manage Donations" : "My Donations"}
            </h1>
            <p className="my-donations-subtitle">
              {isAdmin
                ? "Review and approve donation requests"
                : "Track the status of your donation requests"}
            </p>
          </div>
          {!isAdmin && (
            <button
              className="btn-post-donation"
              onClick={() => navigate("/post-donation")}
            >
              + Post New Donation
            </button>
          )}
        </div>

        <div className="donation-tabs">
          <button
            className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All
            {counts.all > 0 && <span className="tab-count">{counts.all}</span>}
          </button>
          <button
            className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Pending
            {counts.pending > 0 && (
              <span className="tab-count">{counts.pending}</span>
            )}
          </button>
          <button
            className={`tab-btn ${activeTab === "approved" ? "active" : ""}`}
            onClick={() => setActiveTab("approved")}
          >
            Approved
            {counts.approved > 0 && (
              <span className="tab-count">{counts.approved}</span>
            )}
          </button>
          <button
            className={`tab-btn ${activeTab === "rejected" ? "active" : ""}`}
            onClick={() => setActiveTab("rejected")}
          >
            Rejected
            {counts.rejected > 0 && (
              <span className="tab-count">{counts.rejected}</span>
            )}
          </button>
        </div>

        {loading && (
          <div className="loading-state">
            <p>Loading donations...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filteredItems.length === 0 && (
          <div className="empty-state">
            <p>No donations found for this category</p>
          </div>
        )}

        {!loading && !error && filteredItems.length > 0 && (
          <div className="donations-grid">
            {filteredItems.map((item) => (
              <div key={item.item_id} className="donation-card">
                <div className="donation-image">
                  {item.images ? (
                    <img src={item.images} alt={item.title} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
                <div className="donation-content">
                  <h3 className="donation-title">{item.title}</h3>
                  <p className="donation-description">{item.description}</p>
                  <div className="donation-location">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 1.5C5.51472 1.5 3.5 3.51472 3.5 6C3.5 9.5 8 14.5 8 14.5C8 14.5 12.5 9.5 12.5 6C12.5 3.51472 10.4853 1.5 8 1.5ZM8 7.75C7.03352 7.75 6.25 6.96648 6.25 6C6.25 5.03352 7.03352 4.25 8 4.25C8.96648 4.25 9.75 5.03352 9.75 6C9.75 6.96648 8.96648 7.75 8 7.75Z"
                        fill="currentColor"
                      />
                    </svg>
                    {item.pickup_location}
                  </div>
                  <p className="donation-date">
                    Posted on {formatDate(item.post_date)}
                  </p>

                  {isAdmin ? (
                    <div className="admin-actions">
                      <button
                        className="btn-approve"
                        onClick={() =>
                          handleStatusChange(item.item_id, "approved")
                        }
                        disabled={item.status === "approved"}
                      >
                        {item.status === "approved" ? "Approved" : "Approve"}
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() =>
                          handleStatusChange(item.item_id, "rejected")
                        }
                        disabled={item.status === "rejected"}
                      >
                        {item.status === "rejected" ? "Rejected" : "Reject"}
                      </button>
                    </div>
                  ) : (
                    <div className={`status-badge status-${item.status}`}>
                      {item.status.charAt(0).toUpperCase() +
                        item.status.slice(1)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
