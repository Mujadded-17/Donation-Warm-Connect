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

function ItemsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | "all">("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [itemsRes, categoriesRes] = await Promise.all([
          fetch(`${API}/items`, {
            headers: {
              Accept: "application/json",
            },
          }),
          fetch(`${API}/categories`, {
            headers: {
              Accept: "application/json",
            },
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

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories;

    return categories.filter((category) =>
      category.name.toLowerCase().includes(term)
    );
  }, [categories, search]);

  const visibleItems = useMemo(() => {
    if (activeCategory === "all") return normalizedItems;

    return normalizedItems.filter((item) => item.category_id === activeCategory);
  }, [normalizedItems, activeCategory]);

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

  return (
    <div className="en-page">
      <section className="en-top">
        <h1 className="en-title">Explore Needs</h1>

        <div className="en-search-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search category..."
            className="en-search"
            aria-label="Search category"
          />
        </div>

        <div className="en-categories">
          <button
            type="button"
            className={`en-category ${activeCategory === "all" ? "is-active" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            <span className="en-category-label">All</span>
            <span className="en-category-count">{normalizedItems.length} items</span>
          </button>

          {filteredCategories.map((category) => {
            const count = countsByCategory.get(category.category_id) || 0;

            return (
              <button
                key={category.category_id}
                type="button"
                className={`en-category ${activeCategory === category.category_id ? "is-active" : ""}`}
                onClick={() => setActiveCategory(category.category_id)}
              >
                <span className="en-category-label">{category.name}</span>
                <span className="en-category-count">{count} items</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="en-list-section">
        <h2 className="en-subtitle">
          {activeCategory === "all"
            ? "All Categories"
            : `${categoryNameMap.get(activeCategory) || "Category"} Items`}
        </h2>

        {loading && <div className="en-state">Loading items...</div>}

        {!loading && error && (
          <div className="en-state en-state-error">Error: {error}</div>
        )}

        {!loading && !error && visibleItems.length === 0 && (
          <div className="en-state">No items found in this category.</div>
        )}

        {!loading && !error && visibleItems.length > 0 && (
          <div className="en-grid">
            {visibleItems.map((item) => (
              <article key={item.item_id} className="en-card">
                <div className="en-card-image-wrap">
                  {item.images ? (
                    <img
                      src={item.images}
                      alt={item.title}
                      className="en-card-image"
                    />
                  ) : (
                    <div className="en-card-placeholder">No Image</div>
                  )}
                </div>

                <div className="en-card-content">
                  <h3 className="en-card-title">{item.title}</h3>
                  <p className="en-card-meta">{item.categoryName}</p>
                  <p className="en-card-owner">By: Community Donor</p>
                  <p className="en-card-location">📍 {item.pickup_location}</p>

                  <button
                    type="button"
                    className="en-card-btn"
                    onClick={() => handleRequestItem(item)}
                    disabled={requestingId === item.item_id}
                  >
                    {requestingId === item.item_id ? "Requesting..." : "Request Item"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ItemsPage;