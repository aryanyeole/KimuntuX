import React, { createContext, useContext, useState, useEffect } from 'react';

const TenantContext = createContext();

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export const TenantProvider = ({ children }) => {
  const [currentTenant, setCurrentTenantState] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('kimuntu_tenant');
    if (saved) {
      try {
        setCurrentTenantState(JSON.parse(saved));
      } catch {
        localStorage.removeItem('kimuntu_tenant');
      }
    }

    // Re-hydrate when UserContext bootstraps the tenant during boot
    const handleTenantUpdated = (e) => {
      if (e.detail) setCurrentTenantState(e.detail);
    };
    window.addEventListener('kimuntu-tenant-updated', handleTenantUpdated);
    return () => window.removeEventListener('kimuntu-tenant-updated', handleTenantUpdated);
  }, []);

  const setCurrentTenant = (tenant) => {
    setCurrentTenantState(tenant);
    if (tenant) {
      localStorage.setItem('kimuntu_tenant', JSON.stringify(tenant));
      localStorage.setItem('kimuntu_tenant_id', tenant.id);
    } else {
      localStorage.removeItem('kimuntu_tenant');
      localStorage.removeItem('kimuntu_tenant_id');
    }
  };

  const clearTenant = () => setCurrentTenant(null);

  return (
    <TenantContext.Provider value={{ currentTenant, setCurrentTenant, clearTenant }}>
      {children}
    </TenantContext.Provider>
  );
};
