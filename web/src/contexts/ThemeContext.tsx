import React, { createContext, useContext, useState, useEffect } from 'react';

type ColorTheme = 'blue' | 'orange' | 'purple' | 'green';
type DarkMode = 'light' | 'dark';
type FontSize = 'small' | 'medium' | 'large';

interface ThemeContextType {
  theme: DarkMode;
  colorTheme: ColorTheme;
  fontSize: FontSize;
  toggleTheme: () => void;
  setColorTheme: (color: ColorTheme) => void;
  setFontSize: (size: FontSize) => void;
  primaryBg: string;
  primaryText: string;
  primaryBorder: string;
  primaryGradient: string;
}

// Tailwind class maps (used by components that need programmatic access)
const colorThemes: Record<ColorTheme, {
  bg: string; text: string; border: string; gradient: string;
}> = {
  blue:   { bg: 'bg-blue-600',   text: 'text-blue-600',   border: 'border-blue-600',   gradient: 'from-blue-500 to-indigo-600' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500', gradient: 'from-orange-500 to-red-500'   },
  purple: { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-600', gradient: 'from-violet-500 to-purple-600' },
  green:  { bg: 'bg-green-600',  text: 'text-green-600',  border: 'border-green-600',  gradient: 'from-emerald-500 to-teal-500'  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): DarkMode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<DarkMode>(() => {
    return (localStorage.getItem('theme') as DarkMode) || getSystemTheme();
  });

  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    return (localStorage.getItem('colorTheme') as ColorTheme) || 'blue';
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem('fontSize') as FontSize) || 'medium';
  });

  // Apply dark mode class
  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  // Apply color theme as data attribute + CSS variables
  useEffect(() => {
    localStorage.setItem('colorTheme', colorTheme);
    document.documentElement.setAttribute('data-color-theme', colorTheme);
  }, [colorTheme]);

  // Apply font size as data attribute
  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
    const root = document.documentElement;
    if (fontSize === 'medium') root.removeAttribute('data-font-size');
    else root.setAttribute('data-font-size', fontSize);
  }, [fontSize]);

  // Listen for system theme changes (when user changes OS preference)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const setColorTheme = (color: ColorTheme) => setColorThemeState(color);
  const setFontSize = (size: FontSize) => setFontSizeState(size);

  const colors = colorThemes[colorTheme];

  return (
    <ThemeContext.Provider value={{
      theme,
      colorTheme,
      fontSize,
      toggleTheme,
      setColorTheme,
      setFontSize,
      primaryBg: colors.bg,
      primaryText: colors.text,
      primaryBorder: colors.border,
      primaryGradient: colors.gradient,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
