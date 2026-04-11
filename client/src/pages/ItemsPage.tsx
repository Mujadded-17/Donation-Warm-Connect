import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ExploreNeeds.css";

const API = "http://127.0.0.1:8000/api";

type Item = {
  item_id: number;
  title: string;
  description: string;
  pickup_location: string;
  status: string;
  category_id: number;
  donor_id: number;
  images?: string;
  donor_verified?: boolean | number | string;
  donor_name?: string;
};

type Category = {
  category_id: number;
  name: string;
  icon?: string;
};

type User = {
  user_id: number;
  name?: string;
  email?: string;
  user_type?: string;
};

type NormalizedItem = Item & {
  categoryName: string;
};

const getStoredUser = (): User | null => {
  const rawUser = localStorage.getItem("user");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    return null;
  }
};

function ItemsPage() {
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const isAdminUser =
    String(currentUser?.user_type || "").toLowerCase() === "admin" ||
    String(currentUser?.email || "").toLowerCase() === "silviaadmin@gmail.com";

  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | "all">("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [itemsRes, categoriesRes] = await Promise.all([
          fetch(`${API}/items`, {
            headers: { Accept: "application/json" },
          }),
          fetch(`${API}/categories`, {
            headers: { Accept: "application/json" },
          }),
        ]);

        if (!itemsRes.ok) {
          throw new Error(`Items load failed (${itemsRes.status})`);
        }

        if (!categoriesRes.ok) {
          throw new Error(`Categories load failed (${categoriesRes.status})`);
        }

        const itemsData = (await itemsRes.json()) as Item[];
        const categoriesData = (await categoriesRes.json()) as Category[];

        setItems(Array.isArray(itemsData) ? itemsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load data";
        setError(message);
        setItems([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const categoryNameMap = useMemo(() => {
    const map = new Map<number, string>();

    categories.forEach((category) => {
      map.set(category.category_id, category.name);
    });

    return map;
  }, [categories]);

  const normalizedItems = useMemo<NormalizedItem[]>(() => {
    return items.map((item) => ({
      ...item,
      categoryName: categoryNameMap.get(item.category_id) || "Uncategorized",
    }));
  }, [items, categoryNameMap]);

  const countsByCategory = useMemo(() => {
    const counts = new Map<number, number>();

    normalizedItems.forEach((item) => {
      counts.set(item.category_id, (counts.get(item.category_id) || 0) + 1);
    });

    return counts;
  }, [normalizedItems]);

  const visibleItems = useMemo<NormalizedItem[]>(() => {
    let result = [...normalizedItems];

    if (activeCategory !== "all") {
      result = result.filter((item) => item.category_id === activeCategory);
    }

    const term = search.trim().toLowerCase();

    if (term) {
      result = result.filter((item) => {
        return (
          item.title.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term) ||
          item.pickup_location.toLowerCase().includes(term) ||
          item.categoryName.toLowerCase().includes(term)
        );
      });
    }

    if (verifiedOnly) {
      result = result.filter((item) => {
        const value = item.donor_verified;
        return (
          value === true ||
          value === 1 ||
          value === "1" ||
          value === "true"
        );
      });
    }

    return result;
  }, [normalizedItems, activeCategory, search, verifiedOnly]);

  const exploreSubtitle = isAdminUser
    ? "Browse community donations and review what's available without request actions."
    : "Browse useful community donations and request what you need.";

  const handleRequestItem = async (item: Item) => {
    const rawUser = localStorage.getItem("user");
    const token = localStorage.getItem("token") || "";

    if (!rawUser) {
      navigate("/login");
      return;
    }

    let user: User | null = null;

    try {
      user = JSON.parse(rawUser) as User;
    } catch {
      navigate("/login");
      return;
    }

    if (!user?.user_id) {
      alert("Please login again.");
      navigate("/login");
      return;
    }

    if (!token) {
      alert("Authentication token not found. Please login again.");
      navigate("/login");
      return;
    }

    if ((user.user_type || "").toLowerCase() !== "receiver") {
      alert("Only receivers can request items.");
      return;
    }

    if (user.user_id === item.donor_id) {
      alert("You cannot request your own item.");
      return;
    }

    try {
      setRequestingId(item.item_id);

      const response = await fetch(`${API}/donations/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          item_id: item.item_id,
          receiver_id: user.user_id,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data?.message || "Failed to request item");
      }

      alert(data?.message || "Request sent successfully.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to request item";
      alert(message);
    } finally {
      setRequestingId(null);
    }
  };

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();

    if (lower.includes("furniture")) return "🛋";
    if (lower.includes("electronic")) return "💻";
    if (lower.includes("cloth")) return "👕";
    if (lower.includes("book")) return "📚";
    if (lower.includes("food")) return "🍲";
    if (lower.includes("toy")) return "🧸";
    if (lower.includes("house")) return "🏠";
    if (lower.includes("makeup")) return "💄";

    return "▦";
  };

  return (
    <div className="explore-page">
      <div className="explore-shell">
        <aside className="explore-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Categories</h3>

            <div className="category-menu">
              <button
                type="button"
                className={`category-menu-item ${
                  activeCategory === "all" ? "active" : ""
                }`}
                onClick={() => setActiveCategory("all")}
              >
                <span className="category-menu-left">
                  <span className="category-icon">▦</span>
                  <span>All Items</span>
                </span>
                <span className="category-count-pill">
                  {normalizedItems.length}
                </span>
              </button>

              {categories.map((category) => {
                const count = countsByCategory.get(category.category_id) || 0;

                return (
                  <button
                    key={category.category_id}
                    type="button"
                    className={`category-menu-item ${
                      activeCategory === category.category_id ? "active" : ""
                    }`}
                    onClick={() => setActiveCategory(category.category_id)}
                  >
                    <span className="category-menu-left">
                      <span className="category-icon">
                        {getCategoryIcon(category.name)}
                      </span>
                      <span>{category.name}</span>
                    </span>
                    <span className="category-count-pill">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          

        </aside>

        <main className="explore-content">
          <div className="explore-topbar">
            <div className="search-box">
              <span className="search-icon">⌕</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for items near you..."
                aria-label="Search items"
              />
            </div>

         
          </div>

          <div className="explore-header">
            <div>
              <h1 className="explore-heading">Donations Near You</h1>
              <p className="explore-subtext">
                {exploreSubtitle}
              </p>
            </div>

            <div className="results-count">
              Showing <strong>{visibleItems.length}</strong> items
            </div>
          </div>

          {loading && <div className="state-box">Loading items...</div>}

          {!loading && error && (
            <div className="state-box state-error">Error: {error}</div>
          )}

          {!loading && !error && visibleItems.length === 0 && (
            <div className="state-box">
              No items found. Try another search or category.
            </div>
          )}

          {!loading && !error && visibleItems.length > 0 && (
            <div className={viewMode === "grid" ? "items-grid" : "items-list"}>
              {visibleItems.map((item) => (
                <article key={item.item_id} className="donation-card">
                  <div className="card-image">
                    {item.images ? (
                      <img src={item.images} alt={item.title} />
                    ) : (
                      <div className="card-placeholder">No Image</div>
                    )}
                  </div>

                  <div className="card-body">
                    <div className="card-category">{item.categoryName}</div>

                    <div className="card-title-row">
                      <h3 className="card-title">{item.title}</h3>
                      <span className="card-location">
                        📍 {item.pickup_location}
                      </span>
                    </div>

                    <p className="card-description">
                      {item.description?.trim()
                        ? item.description
                        : "Good condition donation item available."}
                    </p>

                    <div className="card-divider" />

                    <div className="card-footer">
                      <div className="card-donor">
                        <div className="card-avatar">
                          {(item.donor_name?.charAt(0) || "D").toUpperCase()}
                        </div>

                        <div className="card-donor-text">
                          <span className="card-donor-name">
                            {item.donor_name?.trim() || "Community Donor"}
                          </span>
                          <span className="card-donor-status">
                            {item.status === "approved"
                              ? "Available now"
                              : item.status}
                          </span>
                        </div>
                      </div>

                      {!isAdminUser ? (
                        <button
                          className="card-btn"
                          onClick={() => handleRequestItem(item)}
                          disabled={requestingId === item.item_id}
                        >
                          {requestingId === item.item_id ? "..." : "Request"}
                        </button>
                      ) : (
                        <div className="card-admin-note">Admin view only</div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default ItemsPage;