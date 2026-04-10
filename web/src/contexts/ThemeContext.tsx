import React, { createContext, useContext, useState, useEffect } from 'react';

type ColorTheme = 'blue' | 'orange' | 'purple' | 'green' | 'custom';
type DarkMode = 'light' | 'dark';
type FontSize = 'small' | 'medium' | 'large';

interface ThemeContextType {
  theme: DarkMode;
  colorTheme: ColorTheme;
  fontSize: FontSize;
  toggleTheme: () => void;
  setColorTheme: (color: ColorTheme) => void;
  setCustomColor: (hex: string) => void;
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
  custom: { bg: 'bg-blue-600',   text: 'text-blue-600',   border: 'border-blue-600',   gradient: 'from-blue-500 to-indigo-600' },
};

// Convert hex to CSS variables for custom theme
function applyCustomColor(hex: string) {
  const root = document.documentElement;
  // Slightly lighter shade for 'to'
  root.style.setProperty('--p-from', hex);
  root.style.setProperty('--p-to', adjustHex(hex, -30));
  root.style.setProperty('--p-mid', hex);
  root.style.setProperty('--p-500', hex);
  root.style.setProperty('--p-600', adjustHex(hex, -20));
  root.style.setProperty('--p-text', hex);
  root.style.setProperty('--p-ring', hex + '59');   // 35% opacity
  root.style.setProperty('--p-shadow', hex + '4d'); // 30% opacity
  root.style.setProperty('--p-glow', hex + '80');   // 50% opacity
}

function adjustHex(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

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

  const [customColor, setCustomColorState] = useState<string>(() => {
    return localStorage.getItem('customColor') || '#6366f1';
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
    if (colorTheme === 'custom') {
      document.documentElement.removeAttribute('data-color-theme');
      applyCustomColor(customColor);
    } else {
      document.documentElement.setAttribute('data-color-theme', colorTheme);
      // Clear any inline custom vars
      const vars = ['--p-from','--p-to','--p-mid','--p-500','--p-600','--p-text','--p-ring','--p-shadow','--p-glow'];
      vars.forEach(v => document.documentElement.style.removeProperty(v));
    }
  }, [colorTheme, customColor]);

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
  const setCustomColor = (hex: string) => {
    setCustomColorState(hex);
    localStorage.setItem('customColor', hex);
    setColorThemeState('custom');
  };
  const setFontSize = (size: FontSize) => setFontSizeState(size);

  const colors = colorThemes[colorTheme];

  return (
    <ThemeContext.Provider value={{
      theme,
      colorTheme,
      fontSize,
      toggleTheme,
      setColorTheme,
      setCustomColor,
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
