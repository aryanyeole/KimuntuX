import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    setError("");
    const ok = login(username, password);
    if (ok) nav("/");
    else setError("Invalid username or password" );
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
          <h1 style={{ marginTop: 0 }}>Sign in</h1>
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
            Log in
          </button>
          <p style={{ fontSize: 12, marginTop: 12 }}>
            <Link to="/signup">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}