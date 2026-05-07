import React, { createContext, useContext, useEffect, useState } from 'react';

export type PaletteName = 'emerald' | 'ocean' | 'sunset' | 'violet' | 'mono' | 'rose';
export type ModeName = 'light' | 'dark';

interface ThemeContextType {
  mode: ModeName;
  palette: PaletteName;
  setMode: (m: ModeName) => void;
  setPalette: (p: PaletteName) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
};

export const PALETTES: Record<PaletteName, { hue: number; sat: number; label: string; swatch: string }> = {
  emerald: { hue: 152, sat: 55, label: 'Emerald', swatch: 'hsl(152,55%,42%)' },
  ocean:   { hue: 210, sat: 65, label: 'Ocean',   swatch: 'hsl(210,65%,45%)' },
  sunset:  { hue: 25,  sat: 80, label: 'Sunset',  swatch: 'hsl(25,80%,50%)'  },
  violet:  { hue: 270, sat: 55, label: 'Violet',  swatch: 'hsl(270,55%,50%)' },
  mono:    { hue: 220, sat: 8,  label: 'Mono',    swatch: 'hsl(220,8%,30%)'  },
  rose:    { hue: 340, sat: 60, label: 'Rose',    swatch: 'hsl(340,60%,50%)' },
};

function genVars(hue: number, sat: number, mode: ModeName): Record<string, string> {
  const s = (p: number) => Math.round(sat * p);
  if (mode === 'light') {
    return {
      '--background': `${hue} ${s(0.3)}% 98%`,
      '--foreground': `${hue} ${s(0.5)}% 8%`,
      '--card': `${hue} ${s(0.15)}% 100%`,
      '--card-foreground': `${hue} ${s(0.5)}% 8%`,
      '--popover': `${hue} ${s(0.15)}% 100%`,
      '--popover-foreground': `${hue} ${s(0.5)}% 8%`,
      '--primary': `${hue} ${sat}% 42%`,
      '--primary-foreground': `0 0% 100%`,
      '--secondary': `${hue} ${s(0.25)}% 94%`,
      '--secondary-foreground': `${hue} ${s(0.5)}% 12%`,
      '--muted': `${hue} ${s(0.15)}% 94%`,
      '--muted-foreground': `${hue} ${s(0.15)}% 46%`,
      '--accent': `${hue} ${s(0.2)}% 92%`,
      '--accent-foreground': `${hue} ${s(0.5)}% 12%`,
      '--destructive': `0 72% 51%`,
      '--destructive-foreground': `0 0% 100%`,
      '--border': `${hue} ${s(0.15)}% 89%`,
      '--input': `${hue} ${s(0.15)}% 89%`,
      '--ring': `${hue} ${sat}% 42%`,
      '--success': `152 55% 42%`,
      '--success-foreground': `0 0% 100%`,
      '--warning': `38 92% 50%`,
      '--warning-foreground': `38 50% 15%`,
      '--sidebar-background': `${hue} ${s(0.12)}% 97%`,
      '--sidebar-foreground': `${hue} ${s(0.3)}% 25%`,
      '--sidebar-primary': `${hue} ${sat}% 38%`,
      '--sidebar-primary-foreground': `0 0% 100%`,
      '--sidebar-accent': `${hue} ${s(0.18)}% 93%`,
      '--sidebar-accent-foreground': `${hue} ${s(0.3)}% 15%`,
      '--sidebar-border': `${hue} ${s(0.1)}% 90%`,
      '--sidebar-ring': `${hue} ${sat}% 42%`,
    };
  }
  return {
    '--background': `${hue} ${s(0.3)}% 6%`,
    '--foreground': `${hue} ${s(0.12)}% 93%`,
    '--card': `${hue} ${s(0.2)}% 9%`,
    '--card-foreground': `${hue} ${s(0.12)}% 93%`,
    '--popover': `${hue} ${s(0.2)}% 9%`,
    '--popover-foreground': `${hue} ${s(0.12)}% 93%`,
    '--primary': `${hue} ${sat}% 52%`,
    '--primary-foreground': `0 0% 100%`,
    '--secondary': `${hue} ${s(0.18)}% 14%`,
    '--secondary-foreground': `${hue} ${s(0.12)}% 90%`,
    '--muted': `${hue} ${s(0.1)}% 14%`,
    '--muted-foreground': `${hue} ${s(0.08)}% 55%`,
    '--accent': `${hue} ${s(0.13)}% 17%`,
    '--accent-foreground': `${hue} ${s(0.12)}% 90%`,
    '--destructive': `0 62% 42%`,
    '--destructive-foreground': `0 0% 100%`,
    '--border': `${hue} ${s(0.1)}% 17%`,
    '--input': `${hue} ${s(0.1)}% 17%`,
    '--ring': `${hue} ${sat}% 52%`,
    '--success': `152 50% 45%`,
    '--success-foreground': `0 0% 100%`,
    '--warning': `38 80% 52%`,
    '--warning-foreground': `38 50% 10%`,
    '--sidebar-background': `${hue} ${s(0.18)}% 8%`,
    '--sidebar-foreground': `${hue} ${s(0.08)}% 85%`,
    '--sidebar-primary': `${hue} ${sat}% 48%`,
    '--sidebar-primary-foreground': `0 0% 100%`,
    '--sidebar-accent': `${hue} ${s(0.12)}% 14%`,
    '--sidebar-accent-foreground': `${hue} ${s(0.08)}% 85%`,
    '--sidebar-border': `${hue} ${s(0.08)}% 14%`,
    '--sidebar-ring': `${hue} ${sat}% 52%`,
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ModeName>(() => (localStorage.getItem('theme-mode') as ModeName) || 'light');
  const [palette, setPalette] = useState<PaletteName>(() => (localStorage.getItem('theme-palette') as PaletteName) || 'emerald');

  useEffect(() => {
    const { hue, sat } = PALETTES[palette];
    const vars = genVars(hue, sat, mode);
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.classList.toggle('dark', mode === 'dark');
    localStorage.setItem('theme-mode', mode);
    localStorage.setItem('theme-palette', palette);
  }, [mode, palette]);

  const toggleMode = () => setMode(m => m === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ mode, palette, setMode, setPalette, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
