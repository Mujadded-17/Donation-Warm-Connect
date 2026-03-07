import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Login.css";

const API = "http://127.0.0.1:8000/api";

export default function Login() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");

    try {
      const res = await axios.post(
        `${API}/login`,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data?.success) {
        localStorage.setItem("user", JSON.stringify(res.data.user));

        setMsg("✅ Login successful!");

        setTimeout(() => nav("/dashboard"), 600);
      } else {
        setError(res.data?.message || "Login failed");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Login failed. Check backend."
      );
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-shell">
        <div className="auth-panel auth-panel-left">
          <h2 className="auth-hero-title">
            Welcome Back
          </h2>
        </div>

        <div className="auth-panel auth-panel-right">
          <div className="auth-form-wrap">

            {msg && <div className="message success-message">{msg}</div>}
            {error && <div className="message error-message">{error}</div>}

            <form onSubmit={submit} className="auth-form">

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button type="submit" className="btn-primary">
                Login
              </button>

            </form>

            <p>
              New user? <Link to="/register">Register</Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}