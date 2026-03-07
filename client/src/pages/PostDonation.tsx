import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/PostDonation.css";

const API = "http://127.0.0.1:8000/api";

type DonationForm = {
  title: string;
  description: string;
  pickup_location: string;
  delivery_available: boolean;
  category_id: number;
  images: string;
};

type Category = {
  category_id: number;
  name: string;
  icon?: string;
};

export default function PostDonation() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<DonationForm>({
    title: "",
    description: "",
    pickup_location: "",
    delivery_available: false,
    category_id: 1,
    images: "",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API}/categories`, {
          headers: { Accept: "application/json" },
        });
        
        if (response.data && Array.isArray(response.data)) {
          setCategories(response.data);
          if (response.data.length > 0) {
            setForm((prev) => ({ ...prev, category_id: response.data[0].category_id }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        // Set default categories if fetch fails
        setCategories([
          { category_id: 1, name: "Clothing" },
          { category_id: 2, name: "Food" },
          { category_id: 3, name: "Books" },
          { category_id: 4, name: "Furniture" },
          { category_id: 5, name: "Electronics" },
          { category_id: 6, name: "Toys" },
          { category_id: 7, name: "Household" },
          { category_id: 8, name: "Other" },
        ]);
      }
    };

    fetchCategories();
  }, []);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Image size should not exceed 10MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setForm((prev) => ({ ...prev, images: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, delivery_available: e.target.checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");

    // Validate required fields
    if (!form.title.trim()) {
      setError("Item name is required");
      return;
    }

    if (!form.description.trim()) {
      setError("Description is required");
      return;
    }

    if (!form.pickup_location.trim()) {
      setError("Pickup location is required");
      return;
    }

    // Get logged in user
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      setError("Please login to post a donation");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    let user;
    try {
      user = JSON.parse(userStr);
    } catch {
      setError("Invalid user session. Please login again");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    if (!user.user_id) {
      setError("User ID not found. Please login again");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        pickup_location: form.pickup_location,
        delivery_available: form.delivery_available ? 1 : 0,
        category_id: form.category_id,
        images: form.images || "",
        donor_id: user.user_id,
        status: "pending",
      };

      const res = await axios.post(`${API}/items`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (res.status === 201) {
        setMsg("✅ Donation posted successfully! Awaiting admin approval.");
        
        // Reset form
        setForm({
          title: "",
          description: "",
          pickup_location: "",
          delivery_available: false,
          category_id: 1,
          images: "",
        });
        setImagePreview("");

        // Redirect after delay
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setError(res.data?.message || "Failed to post donation");
      }
    } catch (err: unknown) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const backendMessage = (err.response?.data as { message?: string } | undefined)
          ?.message;

        if (backendMessage) {
          setError(backendMessage);
        } else if (!err.response) {
          setError("Cannot reach backend server. Please ensure the API is running.");
        } else if (status === 401 || status === 403) {
          setError("Unauthorized. Please login again.");
          setTimeout(() => navigate("/login"), 1500);
        } else if (status === 422) {
          setError("Invalid data. Please check your inputs.");
        } else {
          setError(`Failed to post donation (HTTP ${status}).`);
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (
      form.title ||
      form.description ||
      form.pickup_location ||
      imagePreview
    ) {
      if (window.confirm("Are you sure you want to cancel? Your changes will be lost.")) {
        navigate("/");
      }
    } else {
      navigate("/");
    }
  };

  return (
    <div className="post-donation-container">
      <div className="post-donation-card">
        <h1 className="post-donation-title">Post a Donation</h1>
        <p className="post-donation-subtitle">
          Share items you would like to donate with the community
        </p>

        {msg && <div className="post-donation-message success">{msg}</div>}
        {error && <div className="post-donation-message error">{error}</div>}

        <form onSubmit={handleSubmit} className="post-donation-form">
          {/* Image Upload */}
          <div className="form-group">
            <label className="form-label">
              Item Image <span className="required">*</span>
            </label>
            <div
              className="image-upload-area"
              onClick={handleImageClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleImageClick();
                }
              }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="image-preview"
                />
              ) : (
                <div className="image-placeholder">
                  <svg
                    className="image-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="upload-text">Click to upload image</p>
                  <p className="upload-hint">PNG, JPG, GIF up to 10MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden-file-input"
              />
            </div>
          </div>

          {/* Item Name */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Item Name <span className="required">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="e.g., Winter Jacket, Books, etc."
              value={form.title}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Provide details about the item, its condition, and why you're donating it..."
              value={form.description}
              onChange={handleInputChange}
              className="form-textarea"
              rows={5}
              required
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="category_id" className="form-label">
              Category <span className="required">*</span>
            </label>
            <select
              id="category_id"
              name="category_id"
              value={form.category_id}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  category_id: parseInt(e.target.value, 10),
                }))
              }
              className="form-input"
              required
            >
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pickup Location */}
          <div className="form-group">
            <label htmlFor="pickup_location" className="form-label">
              Pickup Location <span className="required">*</span>
            </label>
            <input
              id="pickup_location"
              name="pickup_location"
              type="text"
              placeholder="e.g., Brooklyn, NY"
              value={form.pickup_location}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          {/* Delivery Available */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.delivery_available}
                onChange={handleCheckboxChange}
                className="form-checkbox"
              />
              <span>Delivery available</span>
            </label>
          </div>

          {/* Info Message */}
          <div className="info-message">
            <svg
              className="info-icon"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p>
              Your donation request will be reviewed by an admin. Once approved,
              it will appear on the browsing page for others to see and request.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-cancel"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Donation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
