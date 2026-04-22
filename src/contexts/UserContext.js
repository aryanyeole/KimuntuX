import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const savedUser = localStorage.getItem('kimuntu_user');
      const savedToken = localStorage.getItem('kimuntu_token');
      const savedTenantId = localStorage.getItem('kimuntu_tenant_id');

      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedToken) setToken(savedToken);

      // If token exists but tenant not yet bootstrapped, fetch from backend.
      // This handles users who logged in before multi-tenancy was deployed.
      if (savedToken && !savedTenantId) {
        try {
          const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
          const resp = await fetch(`${API_BASE}/auth/me/tenant`, {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          if (resp.ok) {
            const tenant = await resp.json();
            localStorage.setItem('kimuntu_tenant', JSON.stringify(tenant));
            localStorage.setItem('kimuntu_tenant_id', tenant.id);
            window.dispatchEvent(new CustomEvent('kimuntu-tenant-updated', { detail: tenant }));
          }
        } catch {
          // Network error — continue without tenant; CRM will show error
        }
      }

      setIsLoading(false);
    };
    bootstrap();
  }, []);

  const login = (userData, accessToken = null, tenantData = null) => {
    setUser(userData);
    localStorage.setItem('kimuntu_user', JSON.stringify(userData));
    localStorage.setItem('kimuntu_current_user', JSON.stringify(userData));
    if (accessToken) {
      setToken(accessToken);
      localStorage.setItem('kimuntu_token', accessToken);
    }
    if (tenantData) {
      localStorage.setItem('kimuntu_tenant', JSON.stringify(tenantData));
      localStorage.setItem('kimuntu_tenant_id', tenantData.id);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('kimuntu_user');
    localStorage.removeItem('kimuntu_current_user');
    localStorage.removeItem('kimuntu_token');
    localStorage.removeItem('kimuntu_tenant');
    localStorage.removeItem('kimuntu_tenant_id');
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
