import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav
      style={{
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#1f2937",
        color: "white",
      }}
    >
      <h2 style={{ margin: 0 }}>Donation Warm Connect</h2>

      <div style={{ display: "flex", gap: "16px" }}>
        <Link to="/" style={{ color: "white", textDecoration: "none" }}>
          Home
        </Link>
        <Link to="/items" style={{ color: "white", textDecoration: "none" }}>
          Items
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;