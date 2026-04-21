import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

function readStoredUser() {
  try {
    const raw = localStorage.getItem('kimuntu_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      isAdmin: !!(parsed.isAdmin ?? parsed.is_admin)
    };
  } catch {
    return null;
  }
}

function readStoredToken() {
  try {
    return localStorage.getItem('kimuntu_token');
  } catch {
    return null;
  }
}

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(readStoredToken);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
    const savedUser = localStorage.getItem('kimuntu_user');
    const savedToken = localStorage.getItem('kimuntu_token');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser({
          ...parsed,
          isAdmin: !!(parsed.isAdmin ?? parsed.is_admin)
        });
      } catch {
        setUser(null);
      }
    }
    if (savedToken) {
      setToken(savedToken);
    }

    const syncProfile = async () => {
      if (!savedToken) {
        setIsLoading(false);
        return;
      }
      const requestToken = savedToken;
      try {
        const r = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${requestToken}` }
        });
        if (r.status === 401) {
          if (localStorage.getItem('kimuntu_token') === requestToken) {
            localStorage.removeItem('kimuntu_token');
            localStorage.removeItem('kimuntu_user');
            localStorage.removeItem('kimuntu_current_user');
            setToken(null);
            setUser(null);
          }
          return;
        }
        if (r.ok) {
          const profile = await r.json();
          // Do not overwrite a newer session (e.g. user just logged in as admin while this was in flight).
          if (localStorage.getItem('kimuntu_token') !== requestToken) {
            return;
          }
          const merged = {
            id: profile.id,
            name: profile.full_name,
            email: profile.email,
            isActive: profile.is_active ?? profile.isActive,
            isAdmin: !!(profile.is_admin ?? profile.isAdmin),
            joinDate: profile.created_at
          };
          setUser(merged);
          localStorage.setItem('kimuntu_user', JSON.stringify(merged));
        }
      } catch {
        /* keep cached user */
      } finally {
        setIsLoading(false);
      }
    };

    if (savedToken) {
      syncProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (userData, accessToken = null) => {
    const normalized = {
      ...userData,
      isAdmin: !!(userData.isAdmin ?? userData.is_admin)
    };
    setUser(normalized);
    localStorage.setItem('kimuntu_user', JSON.stringify(normalized));
    localStorage.setItem('kimuntu_current_user', JSON.stringify(normalized));
    if (accessToken) {
      setToken(accessToken);
      localStorage.setItem('kimuntu_token', accessToken);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('kimuntu_user');
    localStorage.removeItem('kimuntu_current_user');
    localStorage.removeItem('kimuntu_token');
    try {
      sessionStorage.removeItem('kimuntu_admin_restore');
    } catch {
      /* ignore */
    }
  };

  /** Restore admin session after "Access account" impersonation (see AdminPage). */
  const stopImpersonating = () => {
    try {
      const raw = sessionStorage.getItem('kimuntu_admin_restore');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const { token: adminToken, user: adminUser } = parsed;
      if (!adminToken || !adminUser) return false;
      sessionStorage.removeItem('kimuntu_admin_restore');
      login(adminUser, adminToken);
      return true;
    } catch {
      return false;
    }
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('kimuntu_user', JSON.stringify(newUser));
    localStorage.setItem('kimuntu_current_user', JSON.stringify(newUser));
  };

  const value = {
    user,
    token,
    login,
    logout,
    stopImpersonating,
    updateUser,
    isLoading,
    isAuthenticated: !!user
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
