import { useEffect, useState, useCallback } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ThemeToggle with per-school persistence.
 * Tries to read schoolId from localStorage (set by useSchool hook elsewhere).
 * Each school gets its own theme setting stored as `theme-{schoolId}`.
 * Falls back to global `theme` key if no school context is available.
 */
export function ThemeToggle() {
  // Read schoolId from localStorage to avoid coupling with useSchool/useAuth
  // (ThemeToggle is used on Login/Landing pages where user isn't authenticated)
  const getSchoolId = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("currentSchoolId") || null;
    }
    return null;
  };

  const getStorageKey = useCallback(() => {
    const sid = getSchoolId();
    return sid ? `theme-${sid}` : "theme";
  }, []);

  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  // Apply theme to DOM and persist to localStorage
  useEffect(() => {
    const root = document.documentElement;
    const key = getStorageKey();
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem(key, "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem(key, "light");
    }
  }, [dark, getStorageKey]);

  // Initialize from localStorage on mount
  useEffect(() => {
    const key = getStorageKey();
    const saved = localStorage.getItem(key);
    if (saved === "dark") {
      setDark(true);
    } else if (saved === "light") {
      setDark(false);
    } else {
      // No saved preference for this school: check global fallback, then system preference
      const globalSaved = localStorage.getItem("theme");
      if (globalSaved === "dark") {
        setDark(true);
      } else if (globalSaved === "light") {
        setDark(false);
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setDark(true);
      }
    }
  }, [getStorageKey]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setDark(!dark)}
      className="h-9 w-9 rounded-xl"
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
