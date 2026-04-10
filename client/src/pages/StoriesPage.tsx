import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../styles/Stories.css";

const API = "http://127.0.0.1:8000/api";

type Story = {
  story_id: number;
  user_id: number;
  user_name: string;
  user_type: string;
  user_avatar?: string;
  title: string;
  content: string;
  item_title?: string;
  image_url?: string;
  likes: number;
  comments: number;
  created_at: string;
  status: "approved" | "pending" | "rejected";
};

type User = {
  user_id: number;
  name?: string;
  user_type?: string;
};

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showShareForm, setShowShareForm] = useState(false);
  const [newStory, setNewStory] = useState({
    title: "",
    content: "",
    item_title: "",
    image_url: "",
  });

  const rawUser = localStorage.getItem("user");
  const currentUser: User | null = rawUser ? JSON.parse(rawUser) : null;

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/stories`);
      if (Array.isArray(response.data)) {
        setStories(response.data);
      } else {
        setStories([]);
      }
    } catch (err) {
      console.error("Failed to fetch stories:", err);
      setError("Could not load stories");
    } finally {
      setLoading(false);
    }
  };

  const handleShareStory = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token") || "";

    try {
      const response = await axios.post(
        `${API}/stories`,
        {
          ...newStory,
          user_id: currentUser?.user_id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.success) {
        alert("Story submitted for review! It will appear once approved.");
        setShowShareForm(false);
        setNewStory({ title: "", content: "", item_title: "", image_url: "" });
        fetchStories(); // Refresh stories
      }
    } catch (err) {
      console.error("Failed to share story:", err);
      alert("Failed to share story. Please try again.");
    }
  };

  const handleLikeStory = async (storyId: number) => {
    const token = localStorage.getItem("token") || "";
    if (!token) {
      alert("Please login to like stories");
      return;
    }

    try {
      await axios.post(
        `${API}/stories/${storyId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchStories(); // Refresh to update like count
    } catch (err) {
      console.error("Failed to like story:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="stories-page">
      <div className="stories-header">
        <h1>Community Stories</h1>
        <p>Real stories of kindness and generosity from our WarmConnect family</p>
        
        {currentUser && (
          <button
            className="share-story-btn"
            onClick={() => setShowShareForm(!showShareForm)}
          >
            {showShareForm ? "Cancel" : "Share Your Story"}
          </button>
        )}
      </div>

      {showShareForm && (
        <div className="share-story-form">
          <h3>Share Your WarmConnect Story</h3>
          <form onSubmit={handleShareStory}>
            <input
              type="text"
              placeholder="Story Title"
              value={newStory.title}
              onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Item Name (optional)"
              value={newStory.item_title}
              onChange={(e) => setNewStory({ ...newStory, item_title: e.target.value })}
            />
            <textarea
              placeholder="Share your experience..."
              value={newStory.content}
              onChange={(e) => setNewStory({ ...newStory, content: e.target.value })}
              rows={5}
              required
            />
            <input
              type="url"
              placeholder="Image URL (optional)"
              value={newStory.image_url}
              onChange={(e) => setNewStory({ ...newStory, image_url: e.target.value })}
            />
            <button type="submit">Submit Story</button>
          </form>
        </div>
      )}

      {loading && <div className="loading">Loading stories...</div>}
      {error && <div className="error">{error}</div>}

      <div className="stories-grid">
        {!loading && stories.length === 0 && (
          <div className="no-stories">
            <p>No stories yet. Be the first to share your experience!</p>
          </div>
        )}

        {stories.map((story) => (
          <div key={story.story_id} className="story-card">
            {story.image_url && (
              <div className="story-image">
                <img src={story.image_url} alt={story.title} />
              </div>
            )}
            
            <div className="story-content">
              <div className="story-header">
                <div className="story-avatar">
                  {story.user_avatar ? (
                    <img src={story.user_avatar} alt={story.user_name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {story.user_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="story-meta">
                  <h3 className="story-name">{story.user_name}</h3>
                  <span className="story-type">
                    {story.user_type === "donor" ? "Donor" : "Receiver"}
                  </span>
                  <span className="story-date">{formatDate(story.created_at)}</span>
                </div>
              </div>

              <h2 className="story-title">{story.title}</h2>
              
              {story.item_title && (
                <div className="story-item">
                  🎁 Item: {story.item_title}
                </div>
              )}
              
              <p className="story-text">{story.content}</p>
              
              <div className="story-footer">
                <button
                  className="like-btn"
                  onClick={() => handleLikeStory(story.story_id)}
                >
                  ❤️ {story.likes} Likes
                </button>
                <span className="comments-count">💬 {story.comments} Comments</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="stories-cta">
        <h3>Have a story to share?</h3>
        <p>Your experience can inspire others to give and receive with kindness.</p>
        {currentUser ? (
          <button onClick={() => setShowShareForm(true)}>Share Your Story</button>
        ) : (
          <Link to="/login">Login to Share Your Story</Link>
        )}
      </div>
    </div>
  );
}