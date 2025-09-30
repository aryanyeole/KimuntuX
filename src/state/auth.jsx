import React, { createContext, useContext, useEffect, useState } from "react";

const AuthCtx = createContext(null);

// using local storage lets us have some sort of log in/signup without needing anything backend
function getUsers() {
  const raw = localStorage.getItem("users");
  if (!raw) return [{ username: "admin", password: "password" }];
  try { return JSON.parse(raw); } catch { return [{ username: "admin", password: "password" }]; }
}

// store users as an array of { username, password } objects
function setUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setAuthed(localStorage.getItem("authed") === "true");
    setChecking(false);
  }, []);

  function login(username, password) {
    const users = getUsers();
    const ok = users.some(u => u.username === username && u.password === password);
    localStorage.setItem("authed", ok ? "true" : "false");
    setAuthed(ok);
    return ok;
  }

  function logout() {
    localStorage.setItem("authed", "false");
    setAuthed(false);
  }

  function signup(username, password) {
    const users = getUsers();
    if (users.some(u => u.username === username)) return { ok: false, error: "Username taken" };
    const next = [...users, { username, password }];
    setUsers(next);
    return { ok: true };
  }

  return (
    <AuthCtx.Provider value={{ authed, checking, login, logout, signup }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() { return useContext(AuthCtx); }