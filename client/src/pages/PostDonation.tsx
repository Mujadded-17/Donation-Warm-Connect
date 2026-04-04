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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API}/categories`, {
          headers: { Accept: "application/json" },
        });

        if (response.data && Array.isArray(response.data)) {
          setCategories(response.data);
          if (response.data.length > 0) {
            setForm((prev) => ({
              ...prev,
              category_id: response.data[0].category_id,
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
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
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

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

    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userStr || !token) {
      setError("Please login again");
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
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 201) {
        setMsg("✅ Donation posted successfully! Awaiting admin approval.");

        setForm({
          title: "",
          description: "",
          pickup_location: "",
          delivery_available: false,
          category_id: categories.length > 0 ? categories[0].category_id : 1,
          images: "",
        });
        setImagePreview("");

        setTimeout(() => {
          navigate("/my-donations");
        }, 1500);
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
          localStorage.removeItem("user");
          localStorage.removeItem("token");
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
    if (form.title || form.description || form.pickup_location || imagePreview) {
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
          <div className="form-group">
            <label className="form-label">
              Item Image <span className="required">*</span>
            </label>

            <div className="image-upload-container" onClick={handleImageClick}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="image-preview" />
              ) : (
                <div className="image-upload-placeholder">
                  <span className="upload-icon">📷</span>
                  <p>Click to upload image</p>
                  <small>PNG, JPG, JPEG up to 10MB</small>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Item Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="title"
              className="form-input"
              placeholder="Enter item name"
              value={form.title}
              onChange={handleInputChange}
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Description <span className="required">*</span>
            </label>
            <textarea
              name="description"
              className="form-textarea"
              placeholder="Describe the item condition, size, etc."
              value={form.description}
              onChange={handleInputChange}
              rows={4}
              maxLength={500}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Category <span className="required">*</span>
            </label>
            <select
              name="category_id"
              className="form-select"
              value={form.category_id}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  category_id: Number(e.target.value),
                }))
              }
              required
            >
              {categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Pickup Location <span className="required">*</span>
            </label>
            <input
              type="text"
              name="pickup_location"
              className="form-input"
              placeholder="Enter pickup location"
              value={form.pickup_location}
              onChange={handleInputChange}
              maxLength={255}
              required
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.delivery_available}
                onChange={handleCheckboxChange}
              />
              <span>Delivery available</span>
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Posting..." : "Post Donation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}