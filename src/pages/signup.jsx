import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";

export default function SignupPage() {
  const nav = useNavigate();
  const { signup } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]   = useState("");

  function onSubmit(e) {
    e.preventDefault();
    setError("");
    const { ok, error } = signup(username.trim(), password);
    if (ok) nav("/login");
    else setError(error || "Signup failed");
  }

  return (
    <div style={{
      minHeight: "100vh",
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center"}}>
        <div style={{ textAlign: "center", marginBottom: 100, marginTop: -200 }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 64 }}>KimuntuX</h1>
          <p style={{ margin: 0, fontSize: 20, color: "#555" }}>
            AI-Driven Digital Brokerage & Affiliate Marketing Platform
          </p>
        </div>
        <form onSubmit={onSubmit} style={{
          width: 320, padding: 24, border: "3px solid #ddd", borderRadius: 12
        }}>
          <h1 style={{ marginTop: 0 }}>Create account</h1>
          <label>Username</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{ width: "95%", margin: "8px 0 16px", padding: 8 }}
          />
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: "95%", margin: "8px 0 16px", padding: 8 }}
          />
          {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}
          <button style={{ width: "100%", padding: 10, borderRadius: 8, border: "none", cursor: "pointer" }}>
            Sign up
          </button>
          <p style={{ fontSize: 12, marginTop: 12 }}>
            <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}