import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/CommunityPage.css";

const API = "http://127.0.0.1:8000/api";

type CommunityStats = {
  total_users: number;
  total_donors: number;
  total_receivers: number;
  total_donations: number;
  total_pending_donations: number;
  total_stories: number;
  total_likes: number;
  fulfilled_requests: number;
  lives_impacted: number;
  monthly_goal: number;
  donations_this_month: number;
  progress_percentage: number;
};

type TopDonor = {
  user_id: number;
  name: string;
  profile_url: string | null;
  donation_count: number;
  rank: number;
};

type Activity = {
  type: 'donation' | 'request' | 'story';
  title: string;
  user_name: string;
  post_date: string;
  item_id?: number;
  story_id?: number;
};

type ThankYou = {
  id: number;
  message: string;
  created_at: string;
  from_user_name: string;
  from_user_avatar: string | null;
  to_user_name: string | null;
  item_title: string | null;
};

type Badge = {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
};

type User = {
  user_id: number;
  name?: string;
  email?: string;
  user_type?: string;
};

export default function CommunityPage() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [topDonors, setTopDonors] = useState<TopDonor[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [thankYous, setThankYous] = useState<ThankYou[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState("");
  const [thankYouTo, setThankYouTo] = useState("");
  const [thankYouItem, setThankYouItem] = useState("");
  const [selectedDonor, setSelectedDonor] = useState<number | null>(null);
  
  const rawUser = localStorage.getItem("user");
  const currentUser: User | null = rawUser ? JSON.parse(rawUser) : null;

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const fetchCommunityData = async () => {
    setLoading(true);
    try {
      const [statsRes, donorsRes, activityRes, gratitudeRes, badgesRes] = await Promise.all([
        axios.get(`${API}/community/stats`),
        axios.get(`${API}/community/top-donors`),
        axios.get(`${API}/community/recent-activity`),
        axios.get(`${API}/community/gratitude-wall`),
        currentUser ? axios.get(`${API}/community/badges/${currentUser.user_id}`) : Promise.resolve({ data: { data: [] } })
      ]);

      setStats(statsRes.data.data);
      setTopDonors(donorsRes.data.data);
      setActivities(activityRes.data.data);
      setThankYous(gratitudeRes.data.data);
      setBadges(badgesRes.data.data);
    } catch (error) {
      console.error("Failed to fetch community data:", error);
    } finally {
      setLoading(false);
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
      
      alert("✅ Thank you message posted successfully!");
      
      setShowThankYouModal(false);
      setThankYouMessage("");
      setThankYouTo("");
      setThankYouItem("");
      setSelectedDonor(null);
      fetchCommunityData();
    } catch (error) {
      console.error("Failed to send thank you:", error);
      alert("Failed to send thank you message");
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'donation': return '🎁';
      case 'request': return '🙏';
      case 'story': return '📖';
      default: return '✨';
    }
  };

  if (loading) {
    return (
      <div className="cp-container">
        <div className="cp-loading">
          <div className="cp-spinner"></div>
          <p>Loading community...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-container">
      {/* Header - No Back Button */}
      <div className="cp-header">
        <div className="cp-header-content">
          <h1>🌍 My Community</h1>
          <p>Together we're making a difference, one donation at a time</p>
        </div>
      </div>

      {/* Kindness Thermometer */}
      {stats && (
        <div className="cp-thermometer">
          <div className="cp-thermometer-header">
            <h3>🎯 Community Goal: {stats.monthly_goal.toLocaleString()} Donations</h3>
            <span className="cp-thermometer-stats">
              {stats.donations_this_month.toLocaleString()} / {stats.monthly_goal.toLocaleString()}
            </span>
          </div>
          <div className="cp-thermometer-body">
            <div 
              className="cp-thermometer-fill" 
              style={{ width: `${stats.progress_percentage}%` }}
            >
              <span className="cp-thermometer-percentage">{stats.progress_percentage}%</span>
            </div>
          </div>
          <div className="cp-thermometer-impact">
            <div className="cp-impact-stat">
              <span className="cp-impact-icon">❤️</span>
              <span className="cp-impact-value">{stats.lives_impacted.toLocaleString()}</span>
              <span className="cp-impact-label">Lives Impacted</span>
            </div>
            <div className="cp-impact-stat">
              <span className="cp-impact-icon">🎁</span>
              <span className="cp-impact-value">{stats.total_donations.toLocaleString()}</span>
              <span className="cp-impact-label">Total Donations</span>
            </div>
            <div className="cp-impact-stat">
              <span className="cp-impact-icon">👥</span>
              <span className="cp-impact-value">{stats.total_users.toLocaleString()}</span>
              <span className="cp-impact-label">Community Members</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="cp-grid">
        {/* Top Donors Section */}
        <div className="cp-card">
          <div className="cp-card-header">
            <h3>🏆 Top Donors This Month</h3>
            <span className="cp-card-badge">Leaderboard</span>
          </div>
          <div className="cp-donors-list">
            {topDonors.length === 0 ? (
              <div className="cp-empty-state">
                <p>No donors yet. Be the first!</p>
              </div>
            ) : (
              topDonors.map((donor) => (
                <div key={donor.user_id} className="cp-donor-item">
                  <div className="cp-donor-rank">#{donor.rank}</div>
                  <div className="cp-donor-avatar">
                    {donor.profile_url ? (
                      <img src={donor.profile_url} alt={donor.name} />
                    ) : (
                      <div className="cp-avatar-placeholder">
                        {donor.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="cp-donor-info">
                    <div className="cp-donor-name">{donor.name || "Anonymous Donor"}</div>
                    <div className="cp-donor-stats">{donor.donation_count} donations</div>
                  </div>
                  {currentUser && currentUser.user_type === "receiver" && (
                    <button 
                      className="cp-thank-btn"
                      onClick={() => {
                        setSelectedDonor(donor.user_id);
                        setThankYouTo(donor.name || "Donor");
                        setShowThankYouModal(true);
                      }}
                    >
                      🙏 Thank
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Community Pulse */}
        <div className="cp-card">
          <div className="cp-card-header">
            <h3>📢 Community Pulse</h3>
            <span className="cp-card-badge pulse">Live</span>
          </div>
          <div className="cp-activities-list">
            {activities.length === 0 ? (
              <div className="cp-empty-state">
                <p>No recent activity</p>
              </div>
            ) : (
              activities.map((activity, index) => (
                <div key={index} className="cp-activity-item">
                  <div className="cp-activity-icon">{getActivityIcon(activity.type)}</div>
                  <div className="cp-activity-content">
                    <div className="cp-activity-text">
                      <strong>{activity.user_name}</strong>
                      {activity.type === 'donation' && ` donated "${activity.title}"`}
                      {activity.type === 'request' && ` received "${activity.title}"`}
                      {activity.type === 'story' && ` shared a story: "${activity.title}"`}
                    </div>
                    <div className="cp-activity-time">{formatRelativeTime(activity.post_date)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Badges Section */}
        {badges.length > 0 && (
          <div className="cp-card">
            <div className="cp-card-header">
              <h3>🌟 My Achievements</h3>
              <span className="cp-card-badge">{badges.length} Badges</span>
            </div>
            <div className="cp-badges-list">
              {badges.map((badge) => (
                <div key={badge.id} className="cp-badge-item" style={{ borderLeftColor: badge.color }}>
                  <div className="cp-badge-icon" style={{ backgroundColor: badge.color + '20' }}>
                    {badge.icon}
                  </div>
                  <div className="cp-badge-info">
                    <div className="cp-badge-name">{badge.name}</div>
                    <div className="cp-badge-description">{badge.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gratitude Wall */}
        <div className="cp-card">
          <div className="cp-card-header">
            <h3>💝 Gratitude Wall</h3>
            <span className="cp-card-badge">{thankYous.length} Messages</span>
          </div>
          <div className="cp-gratitude-list">
            {thankYous.length === 0 ? (
              <div className="cp-empty-gratitude">
                <p>No thank you messages yet. Be the first to spread gratitude!</p>
              </div>
            ) : (
              thankYous.map((thankYou) => (
                <div key={thankYou.id} className="cp-gratitude-item">
                  <div className="cp-gratitude-avatar">
                    {thankYou.from_user_avatar ? (
                      <img src={thankYou.from_user_avatar} alt={thankYou.from_user_name} />
                    ) : (
                      <div className="cp-avatar-placeholder small">
                        {thankYou.from_user_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="cp-gratitude-content">
                    <div className="cp-gratitude-message">
                      <strong>{thankYou.from_user_name}</strong> 
                      {thankYou.to_user_name ? ` thanked ${thankYou.to_user_name}` : " shared gratitude"}
                      {thankYou.item_title && ` for "${thankYou.item_title}"`}
                    </div>
                    <div className="cp-gratitude-text">"{thankYou.message}"</div>
                    <div className="cp-gratitude-time">{formatRelativeTime(thankYou.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Community Stats Footer */}
      {stats && (
        <div className="cp-footer">
          <div className="cp-footer-stat">
            <span className="cp-footer-number">{stats.total_stories}</span>
            <span className="cp-footer-label">Community Stories</span>
          </div>
          <div className="cp-footer-stat">
            <span className="cp-footer-number">{stats.total_likes}</span>
            <span className="cp-footer-label">Total Likes</span>
          </div>
          <div className="cp-footer-stat">
            <span className="cp-footer-number">{stats.fulfilled_requests}</span>
            <span className="cp-footer-label">Requests Fulfilled</span>
          </div>
          <div className="cp-footer-stat">
            <span className="cp-footer-number">{stats.total_pending_donations}</span>
            <span className="cp-footer-label">Pending Donations</span>
          </div>
        </div>
      )}

      {/* Thank You Modal */}
      {showThankYouModal && (
        <div className="cp-modal-overlay" onClick={() => setShowThankYouModal(false)}>
          <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-header">
              <h3>🙏 Send Thank You</h3>
              <button className="cp-modal-close" onClick={() => setShowThankYouModal(false)}>✕</button>
            </div>
            <div className="cp-modal-body">
              <p>Sending thank you to: <strong>{thankYouTo}</strong></p>
              <div className="cp-form-group">
                <label>Item Name (optional)</label>
                <input
                  type="text"
                  placeholder="What item are you thanking for?"
                  value={thankYouItem}
                  onChange={(e) => setThankYouItem(e.target.value)}
                />
              </div>
              <div className="cp-form-group">
                <label>Your Message *</label>
                <textarea
                  placeholder="Write your thank you message..."
                  value={thankYouMessage}
                  onChange={(e) => setThankYouMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <div className="cp-modal-footer">
              <button className="cp-btn-cancel" onClick={() => setShowThankYouModal(false)}>Cancel</button>
              <button className="cp-btn-submit" onClick={handleSendThankYou}>Send Thank You</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}