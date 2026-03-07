import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Login.css";

const API = "http://127.0.0.1:8000/api";

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone: string;
  address: string;
  user_type: "receiver" | "donor";
};

export default function Register() {
  const nav = useNavigate();

  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    phone: "",
    address: "",
    user_type: "receiver",
  });

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");

    try {
      const res = await axios.post(`${API}/register`, form, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.data?.success) {
        setMsg("✅ Registered successfully!");
        setTimeout(() => nav("/login"), 800);
      } else {
        setError(res.data?.message || "Registration failed");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Registration failed. Check backend."
      );
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-shell">
        <div className="auth-panel auth-panel-left">
          <h2 className="auth-hero-title">
            Join the WarmConnect Community
          </h2>
        </div>

        <div className="auth-panel auth-panel-right">
          <div className="auth-form-wrap">

            {msg && <div className="message success-message">{msg}</div>}
            {error && <div className="message error-message">{error}</div>}

            <form onSubmit={submit} className="auth-form">

              <input
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={onChange}
                required
              />

              <input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={onChange}
                required
              />

              <input
                name="password"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={onChange}
                required
              />

              <input
                name="password_confirmation"
                type="password"
                placeholder="Confirm Password"
                value={form.password_confirmation}
                onChange={onChange}
                required
              />

              <input
                name="phone"
                placeholder="Phone"
                value={form.phone}
                onChange={onChange}
              />

              <input
                name="address"
                placeholder="Address"
                value={form.address}
                onChange={onChange}
              />

              <select
                name="user_type"
                value={form.user_type}
                onChange={onChange}
              >
                <option value="receiver">Receiver</option>
                <option value="donor">Donor</option>
              </select>

              <button type="submit" className="btn-primary">
                Register
              </button>
            </form>

            <p>
              Already registered? <Link to="/login">Login</Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}