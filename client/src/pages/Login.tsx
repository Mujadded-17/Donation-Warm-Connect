import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { API_URL } from "../config";
import "../styles/Login.css";

export default function Login() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") === "1") {
      setMsg("✅ Email verified successfully. You can log in now.");
      setError("");
      setNeedsVerification(false);
    }
  }, [searchParams]);

  const resendVerification = async () => {
    if (!email) {
      setError("Please enter your email first.");
      return;
    }

    setResending(true);
    setMsg("");
    setError("");

    try {
      const res = await axios.post(
        `${API_URL}/email/verification-notification`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      setMsg(res.data?.message || "Verification email sent successfully.");
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
    setNeedsVerification(false);

    try {
      const res = await axios.post(
        `${API_URL}/login`,
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (res.data?.success) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("token", res.data.token);

        window.dispatchEvent(new Event("auth-changed"));

        setMsg("✅ Login successful!");
        setTimeout(() => nav("/dashboard"), 600);
      } else {
        setError(res.data?.message || "Login failed");
      }
    } catch (err: unknown) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const responseData = err.response?.data as
          | { message?: string; requires_verification?: boolean }
          | undefined;

        if (responseData?.requires_verification) {
          setNeedsVerification(true);
          setError(
            responseData.message ||
              "Please verify your email before logging in."
          );
        } else if (!err.response) {
          setError("Cannot reach backend server. Please try again.");
        } else if (status === 401) {
          setError(responseData?.message || "Invalid email or password.");
        } else if (status === 403) {
          setError(responseData?.message || "Access denied.");
        } else if (status === 429) {
          setError("Too many requests. Please wait a minute and try again.");
        } else {
          setError(responseData?.message || `Login failed (HTTP ${status}).`);
        }

        return;
      }

      setError("Login failed. Check backend.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-shell">
        <div className="auth-panel auth-panel-left">
          <h2 className="auth-hero-title">Welcome Back</h2>
          <p className="auth-hero-sub">
            Log in to continue helping others through WarmConnect.
          </p>
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

            {needsVerification && (
              <div className="verification-box">
                <p className="verification-text">
                  Your account is not verified yet. Click below to resend the
                  verification email.
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
            <p style={{ marginTop: "10px" }}>
               <Link to="/forgot-password">Forgot Password?</Link>
            </p>

            <p>
              New user? <Link to="/register">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}