import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/DonorImpact.css";

const API = "http://127.0.0.1:8000/api";

type ImpactData = {
  total_donations: number;
  pending_donations: number;
  approved_donations: number;
  rejected_donations: number;
  fulfilled_requests: number;
  pending_requests: number;
  recent_donations: number;
  lives_impacted: number;
  success_rate: number;
  top_category: string;
  categories: Array<{ name: string; count: number }>;
};

type User = {
  user_id: number;
  name?: string;
  email?: string;
};

export default function DonorImpact() {
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const rawUser = localStorage.getItem("user");
  const currentUser: User | null = rawUser ? JSON.parse(rawUser) : null;

  useEffect(() => {
    if (!currentUser?.user_id) {
      setError("Please login to view your impact");
      setLoading(false);
      return;
    }
    fetchImpactData();
  }, []);

  const fetchImpactData = async () => {
    const token = localStorage.getItem("token") || "";
    
    try {
      setLoading(true);
      const response = await axios.get(`${API}/donor/impact/${currentUser?.user_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      
      if (response.data?.success) {
        setImpactData(response.data.data);
      } else {
        setError("Failed to load impact data");
      }
    } catch (err) {
      console.error("Failed to fetch impact data:", err);
      setError("Could not load your impact data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="di-container">
        <div className="di-loading">
          <div className="di-spinner"></div>
          <p>Loading your impact data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="di-container">
        <div className="di-error">
          <p>{error}</p>
          <button onClick={fetchImpactData}>Try Again</button>
        </div>
      </div>
    );
  }

  if (!impactData) {
    return null;
  }

  return (
    <div className="di-container">
      <div className="di-header">
        <div className="di-header-content">
          <h1>🌟 My Impact</h1>
          <p>See the positive change you're making in your community</p>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="di-stats-grid">
        <div className="di-stat-card di-stat-primary">
          <div className="di-stat-icon">❤️</div>
          <div className="di-stat-value">{impactData.lives_impacted}</div>
          <div className="di-stat-label">Lives Impacted</div>
          <div className="di-stat-sub">People helped through your donations</div>
        </div>

        <div className="di-stat-card di-stat-success">
          <div className="di-stat-icon">🎁</div>
          <div className="di-stat-value">{impactData.fulfilled_requests}</div>
          <div className="di-stat-label">Requests Fulfilled</div>
          <div className="di-stat-sub">Donations that found a home</div>
        </div>

        <div className="di-stat-card di-stat-info">
          <div className="di-stat-icon">📦</div>
          <div className="di-stat-value">{impactData.total_donations}</div>
          <div className="di-stat-label">Total Donations</div>
          <div className="di-stat-sub">Items you've shared</div>
        </div>

        <div className="di-stat-card di-stat-warning">
          <div className="di-stat-icon">⭐</div>
          <div className="di-stat-value">{impactData.success_rate}%</div>
          <div className="di-stat-label">Success Rate</div>
          <div className="di-stat-sub">Donations approved & delivered</div>
        </div>
      </div>

      {/* Donation Status Section */}
      <div className="di-section">
        <h2>📊 Donation Status</h2>
        <div className="di-status-grid">
          <div className="di-status-item status-approved">
            <span className="status-label">Approved</span>
            <span className="status-value">{impactData.approved_donations}</span>
          </div>
          <div className="di-status-item status-pending">
            <span className="status-label">Pending Review</span>
            <span className="status-value">{impactData.pending_donations}</span>
          </div>
          <div className="di-status-item status-rejected">
            <span className="status-label">Rejected</span>
            <span className="status-value">{impactData.rejected_donations}</span>
          </div>
          <div className="di-status-item status-requests">
            <span className="status-label">Pending Requests</span>
            <span className="status-value">{impactData.pending_requests}</span>
          </div>
        </div>
      </div>

      {/* Categories Breakdown */}
      <div className="di-section">
        <h2>📂 Donation Categories</h2>
        <div className="di-categories">
          {impactData.categories.length > 0 ? (
            impactData.categories.map((cat, index) => (
              <div key={index} className="di-category-item">
                <div className="di-category-name">{cat.name}</div>
                <div className="di-category-bar">
                  <div 
                    className="di-category-bar-fill" 
                    style={{ width: `${(cat.count / impactData.total_donations) * 100}%` }}
                  ></div>
                </div>
                <div className="di-category-count">{cat.count} items</div>
              </div>
            ))
          ) : (
            <p className="di-no-data">No donation categories yet</p>
          )}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="di-quick-stats">
        <div className="di-quick-stat">
          <span className="di-quick-icon">🆕</span>
          <div>
            <div className="di-quick-value">{impactData.recent_donations}</div>
            <div className="di-quick-label">Last 30 Days</div>
          </div>
        </div>
        <div className="di-quick-stat">
          <span className="di-quick-icon">🏆</span>
          <div>
            <div className="di-quick-value">{impactData.top_category}</div>
            <div className="di-quick-label">Top Category</div>
          </div>
        </div>
        <div className="di-quick-stat">
          <span className="di-quick-icon">✅</span>
          <div>
            <div className="di-quick-value">{impactData.fulfilled_requests}</div>
            <div className="di-quick-label">Happy Receivers</div>
          </div>
        </div>
      </div>

      {/* Motivational Message */}
      <div className="di-motivation">
        <p>✨ Every donation makes a difference. Thank you for being part of the WarmConnect community! ✨</p>
      </div>
    </div>
  );
}