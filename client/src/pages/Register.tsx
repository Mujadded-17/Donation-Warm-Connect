import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_URL } from "../config";
import "../styles/Login.css";

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
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resending, setResending] = useState(false);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resendVerification = async () => {
    if (!registeredEmail) return;

    setResending(true);
    setError("");
    setMsg("");

    try {
      const res = await axios.post(
        `${API_URL}/email/verification-notification`,
        { email: registeredEmail },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      setMsg(res.data?.message || "Verification email sent again.");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const backendMessage = (
          err.response?.data as { message?: string } | undefined
        )?.message;

        setError(backendMessage || "Failed to resend verification email.");
      } else {
        setError("Failed to resend verification email.");
      }
    } finally {
      setResending(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");

    try {
      const res = await axios.post(`${API_URL}/register`, form, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (res.data?.success) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.dispatchEvent(new Event("auth-changed"));

        setRegisteredEmail(form.email);
        setMsg(
          res.data?.message ||
            "Registration successful. Please check your email and verify your account before logging in."
        );

        setForm((prev) => ({
          ...prev,
          password: "",
          password_confirmation: "",
        }));
      } else {
        setError(res.data?.message || "Registration failed");
      }
    } catch (err: unknown) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const backendMessage = (
          err.response?.data as { message?: string } | undefined
        )?.message;

        if (backendMessage) {
          setError(backendMessage);
        } else if (!err.response) {
          setError(
            "Cannot reach backend server. Ensure API is running and CORS allows your frontend port."
          );
        } else if (status === 422) {
          setError(
            "Invalid registration input. Please check your data and try again."
          );
        } else if (status === 429) {
          setError("Too many requests. Please wait a minute and try again.");
        } else {
          setError(`Registration failed (HTTP ${status}).`);
        }

        return;
      }

      setError("Registration failed due to an unexpected error.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-shell">
        <div className="auth-panel auth-panel-left">
          <h2 className="auth-hero-title">Join the WarmConnect Community</h2>
          <p className="auth-hero-sub">
            Create your account and verify your email to start donating or
            receiving support safely.
          </p>
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

            {registeredEmail && (
              <div className="verification-box">
                <p className="verification-text">
                  Didn&apos;t get the email? Send the verification link again for{" "}
                  <strong>{registeredEmail}</strong>.
                </p>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={resendVerification}
                  disabled={resending}
                >
                  {resending ? "Sending..." : "Resend Verification Email"}
                </button>
              </div>
            )}

            <p>
              Already registered? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}