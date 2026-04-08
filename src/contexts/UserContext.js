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
    // Restore persisted auth state on app load.
    const savedUser = localStorage.getItem('kimuntu_user');
    const savedToken = localStorage.getItem('kimuntu_token');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedToken) {
      setToken(savedToken);
    }
    setIsLoading(false);
  }, []);

  const login = (userData, accessToken = null) => {
    setUser(userData);
    localStorage.setItem('kimuntu_user', JSON.stringify(userData));
    localStorage.setItem('kimuntu_current_user', JSON.stringify(userData));
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
