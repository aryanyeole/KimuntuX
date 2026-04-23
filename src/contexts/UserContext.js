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
    const bootstrap = async () => {
      const savedUser = localStorage.getItem('kimuntu_user');
      const savedToken = localStorage.getItem('kimuntu_token');

      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser({
            ...parsed,
            isAdmin: !!(parsed.isAdmin ?? parsed.is_admin),
          });
        } catch {
          setUser(null);
        }
      }
      if (savedToken) {
        setToken(savedToken);
      }

      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      const requestToken = savedToken;
      try {
        const r = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${requestToken}` },
        });
        if (r.status === 401) {
          if (localStorage.getItem('kimuntu_token') === requestToken) {
            localStorage.removeItem('kimuntu_token');
            localStorage.removeItem('kimuntu_user');
            localStorage.removeItem('kimuntu_current_user');
            localStorage.removeItem('kimuntu_tenant');
            localStorage.removeItem('kimuntu_tenant_id');
            setToken(null);
            setUser(null);
            window.dispatchEvent(new CustomEvent('kimuntu-tenant-updated', { detail: null }));
          }
          setIsLoading(false);
          return;
        }
        if (r.ok) {
          const profile = await r.json();
          if (localStorage.getItem('kimuntu_token') === requestToken) {
            const merged = {
              id: profile.id,
              name: profile.full_name,
              full_name: profile.full_name,
              email: profile.email,
              phone: profile.phone ?? null,
              address: profile.address ?? null,
              signup_plan: profile.signup_plan ?? null,
              isActive: profile.is_active ?? profile.isActive,
              isAdmin: !!(profile.is_admin ?? profile.isAdmin),
              joinDate: profile.created_at,
            };
            setUser(merged);
            localStorage.setItem('kimuntu_user', JSON.stringify(merged));
          }
        }
      } catch {
        // keep cached user when network hiccups
      }

      // Always load the tenant for this session from the API so the CRM badge matches
      // the logged-in user (avoids stale localStorage from another account).
      try {
        const resp = await fetch(`${API_BASE}/auth/me/tenant`, {
          headers: { Authorization: `Bearer ${requestToken}` },
        });
        if (resp.ok) {
          const tenant = await resp.json();
          if (localStorage.getItem('kimuntu_token') === requestToken) {
            localStorage.setItem('kimuntu_tenant', JSON.stringify(tenant));
            localStorage.setItem('kimuntu_tenant_id', tenant.id);
            window.dispatchEvent(new CustomEvent('kimuntu-tenant-updated', { detail: tenant }));
          }
        } else if (resp.status === 404) {
          if (localStorage.getItem('kimuntu_token') === requestToken) {
            localStorage.removeItem('kimuntu_tenant');
            localStorage.removeItem('kimuntu_tenant_id');
            window.dispatchEvent(new CustomEvent('kimuntu-tenant-updated', { detail: null }));
          }
        }
      } catch {
        // Network error — keep existing tenant in localStorage
      }

      setIsLoading(false);
    };
    bootstrap();
  }, []);

  const login = (userData, accessToken = null, tenantData = null) => {
    const normalized = {
      ...userData,
      isAdmin: !!(userData.isAdmin ?? userData.is_admin),
    };
    setUser(normalized);
    localStorage.setItem('kimuntu_user', JSON.stringify(normalized));
    localStorage.setItem('kimuntu_current_user', JSON.stringify(normalized));
    if (accessToken) {
      setToken(accessToken);
      localStorage.setItem('kimuntu_token', accessToken);
    }
    if (tenantData !== undefined) {
      if (tenantData) {
        localStorage.setItem('kimuntu_tenant', JSON.stringify(tenantData));
        localStorage.setItem('kimuntu_tenant_id', tenantData.id);
        window.dispatchEvent(new CustomEvent('kimuntu-tenant-updated', { detail: tenantData }));
      } else {
        localStorage.removeItem('kimuntu_tenant');
        localStorage.removeItem('kimuntu_tenant_id');
        window.dispatchEvent(new CustomEvent('kimuntu-tenant-updated', { detail: null }));
      }
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
    localStorage.removeItem('kimuntu_tenant');
    localStorage.removeItem('kimuntu_tenant_id');
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
