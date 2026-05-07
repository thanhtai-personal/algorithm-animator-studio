import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeMode = "dark" | "light";
export type Palette = "gold" | "rose" | "ocean" | "emerald";

interface ThemeContextType {
  mode: ThemeMode;
  palette: Palette;
  setMode: (m: ThemeMode) => void;
  setPalette: (p: Palette) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "dark",
  palette: "gold",
  setMode: () => {},
  setPalette: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem("kata-mode") as ThemeMode) || "dark";
  });
  const [palette, setPalette] = useState<Palette>(() => {
    return (localStorage.getItem("kata-palette") as Palette) || "gold";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(mode);
    root.setAttribute("data-palette", palette);
    localStorage.setItem("kata-mode", mode);
    localStorage.setItem("kata-palette", palette);
  }, [mode, palette]);

  return (
    <ThemeContext.Provider value={{ mode, palette, setMode, setPalette }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
