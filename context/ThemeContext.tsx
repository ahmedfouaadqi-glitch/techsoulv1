import React, { createContext, useContext, useEffect, ReactNode } from 'react';

type Theme = 'dark';

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const theme: Theme = 'dark';

  useEffect(() => {
    const root = window.document.documentElement;
    if (!root.classList.contains('dark')) {
        root.classList.remove('light');
        root.classList.add('dark');
    }
    localStorage.setItem('theme', 'dark');
  }, []);

  const value = { theme };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
