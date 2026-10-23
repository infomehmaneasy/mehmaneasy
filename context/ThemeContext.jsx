"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "mehmaan-easy:theme:v1";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let savedTheme = "light";
    try {
      const storedTheme = window.localStorage.getItem(STORAGE_KEY);
      if (storedTheme === "dark" || storedTheme === "light") savedTheme = storedTheme;
    } catch (error) {
      console.error("Unable to load the saved theme preference:", error);
    }
    setTheme(savedTheme);
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      console.error("Unable to save the theme preference:", error);
    }
  }, [theme, ready]);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider.");
  return context;
}
