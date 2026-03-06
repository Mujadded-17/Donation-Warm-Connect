import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div style={{ padding: "40px" }}>
      <section style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "42px", marginBottom: "12px" }}>
          Welcome to Donation Warm Connect
        </h1>

        <p style={{ fontSize: "18px", color: "#444", marginBottom: "24px" }}>
          A platform where donors can share useful items and receivers can
          request what they need.
        </p>

        <div style={{ display: "flex", gap: "16px", marginBottom: "32px" }}>
          <Link
            to="/items"
            style={{
              padding: "12px 20px",
              backgroundColor: "#2563eb",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
            }}
          >
            View Donation Items
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <h3>Donate Items</h3>
            <p>Post clothes, food, books, and other useful items.</p>
          </div>

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <h3>Request Support</h3>
            <p>Receivers can browse available donations and send requests.</p>
          </div>

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <h3>Build Community</h3>
            <p>Help connect donors and people in need more efficiently.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;