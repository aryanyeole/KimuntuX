import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('kimuntu-theme');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('kimuntu-theme', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: {
      primary: '#00C896',
      secondary: '#111111',
      accent: '#DAA520',
      neutralWhite: '#FFFFFF',
      neutralGray: '#E5E5E5',
      text: isDarkMode ? '#FFFFFF' : '#111111',
      background: isDarkMode ? '#111111' : '#FFFFFF',
      cardBackground: isDarkMode ? '#1a1a1a' : '#f8f9fa',
      border: isDarkMode ? '#333333' : '#E5E5E5',
    },
    fonts: {
      title: 'Poppins, sans-serif',
      subtitle: 'Montserrat, sans-serif',
      body: 'Roboto, sans-serif',
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
