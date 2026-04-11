import { useState } from "react";
import axios from "axios";
import { API_URL } from "../config";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");

    try {
      const res = await axios.post(`${API_URL}/forgot-password`, { email });
      setMsg(res.data.message);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error sending email");
    }
  };

  return (
    <div>
      <h2>Forgot Password</h2>
      {msg && <p>{msg}</p>}
      {error && <p>{error}</p>}

      <form onSubmit={submit}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Send Reset Link</button>
      </form>
    </div>
  );
}