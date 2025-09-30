import React from "react";
import { useAuth } from "./state/auth.jsx";

export default function App() {
  const { logout } = useAuth();

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <header style={{
        width: "100%",
          position: "sticky",
          top: 0,
          background: "#fff",
          zIndex: 10,
          borderBottom: "1px solid #e5e7eb"
      }}>
        <div style = {{
          padding: "12px 16px",
          marginTop: -20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12
        }}>
        <div style = {{ fontWeight: 700 }}>KimuntuX</div>
        <div style={{ display: "flex", gap: 32, color: "#444" }}>
            <span>Navigation</span>
            <span>Stuff</span>
            <span>Goes</span>
            <span>Here</span>
          </div>
        <button onClick={logout} style={{
          padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", cursor: "pointer"
        }}>
          Log out
        </button>
        </div>
      </header>
      <main style={{margin: "0 auto", padding: "24px 16px" }}>
        <h1 style={{ marginTop: 0 }}>Main Page</h1>
        <p>
          To be replaced :D
        </p>
      </main>
    </div>
  );
}