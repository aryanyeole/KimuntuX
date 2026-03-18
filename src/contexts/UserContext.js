import React, { createContext, useContext, useState, useEffect } from 'react';
import { clearAccessToken, fetchCurrentUser, getAccessToken, setAccessToken } from '../services/authService';

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
    const initializeAuth = async () => {
      const savedUser = localStorage.getItem('kimuntu_user');
      const savedToken = getAccessToken();

      if (savedToken) {
        setToken(savedToken);
        try {
          const backendUser = await fetchCurrentUser({ token: savedToken });
          setUser(backendUser);
          localStorage.setItem('kimuntu_user', JSON.stringify(backendUser));
        } catch {
          clearAccessToken();
          localStorage.removeItem('kimuntu_user');
          setToken(null);
          setUser(null);
        }
      } else if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (userData, accessToken) => {
    setUser(userData);
    localStorage.setItem('kimuntu_user', JSON.stringify(userData));

    if (accessToken) {
      setAccessToken(accessToken);
      setToken(accessToken);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('kimuntu_user');
    clearAccessToken();
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('kimuntu_user', JSON.stringify(newUser));
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
