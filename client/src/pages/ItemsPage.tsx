import { useEffect, useState } from "react";

type Item = {
  item_id: number;
  title: string;
  description: string;
  pickup_location: string;
  status: string;
};

function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/items")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setItems(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h1>Available Donation Items</h1>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {!error && items.length === 0 && <p>No items found.</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {items.map((item) => (
          <div
            key={item.item_id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "20px",
              background: "#fff",
            }}
          >
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <p>
              <strong>Location:</strong> {item.pickup_location}
            </p>
            <p>
              <strong>Status:</strong> {item.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ItemsPage;