import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";
import "../styles/Login.css";

export default function ResetPassword() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");

    if (!token || !email) {
      setError("Invalid or expired reset link.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/reset-password`,
        {
          token,
          email,
          password,
          password_confirmation: passwordConfirmation,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (res.data?.success) {
        setMsg(res.data.message || "Password reset successful.");
        setTimeout(() => nav("/login"), 1200);
      } else {
        setError(res.data?.message || "Password reset failed.");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as
          | { message?: string; errors?: Record<string, string[]> }
          | undefined;

        if (data?.errors) {
          const firstError = Object.values(data.errors)[0]?.[0];
          setError(firstError || "Validation failed.");
        } else {
          setError(data?.message || "Password reset failed.");
        }
      } else {
        setError("Password reset failed.");
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-shell">
        <div className="auth-panel auth-panel-left">
          <h2 className="auth-hero-title">Reset Your Password</h2>
          <p className="auth-hero-sub">
            Enter your new password to regain access to your account.
          </p>
        </div>

        <div className="auth-panel auth-panel-right">
          <div className="auth-form-wrap">
            {msg && <div className="message success-message">{msg}</div>}
            {error && <div className="message error-message">{error}</div>}

            <form onSubmit={submit} className="auth-form">
              <input type="email" value={email} readOnly />

              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Confirm New Password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
              />

              <button type="submit" className="btn-primary">
                Reset Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}