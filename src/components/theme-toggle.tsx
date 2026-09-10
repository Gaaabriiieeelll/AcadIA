"use client";

import { useSyncExternalStore } from "react";

const THEME_STORAGE_KEY = "acadia-theme";
const THEME_CHANGE_EVENT = "acadia-theme-change";

type Theme = "light" | "dark";

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): Theme | null {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "dark" || storedTheme === "light" ? storedTheme : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function getThemeSnapshot(): Theme | null {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerThemeSnapshot(): Theme | null {
  return null;
}

function subscribeToTheme(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function handleSystemThemeChange() {
    if (getStoredTheme()) return;
    applyTheme(getSystemTheme());
    onStoreChange();
  }

  function handleStorage(event: StorageEvent) {
    if (event.key !== THEME_STORAGE_KEY) return;
    const nextTheme = event.newValue === "dark" || event.newValue === "light"
      ? event.newValue
      : getSystemTheme();
    applyTheme(nextTheme);
    onStoreChange();
  }

  mediaQuery.addEventListener("change", handleSystemThemeChange);
  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);

  return () => {
    mediaQuery.removeEventListener("change", handleSystemThemeChange);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

type ThemeToggleProps = {
  className?: string;
  compact?: boolean;
};

export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  function toggleTheme() {
    const nextTheme: Theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // The visual preference still applies for the current page if storage is unavailable.
    }

    window.dispatchEvent(new CustomEvent<Theme>(THEME_CHANGE_EVENT, { detail: nextTheme }));
  }

  const accessibleLabel = theme === "dark" ? "Ativar modo claro" : theme === "light" ? "Ativar modo escuro" : "Alternar tema";
  const classes = ["theme-toggle", compact ? "theme-toggle-compact" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      aria-label={accessibleLabel}
      aria-pressed={theme === "dark"}
      className={classes}
      onClick={toggleTheme}
      title={accessibleLabel}
      type="button"
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        <svg className="theme-toggle-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M20.2 15.5A8.4 8.4 0 0 1 8.5 3.8 8.5 8.5 0 1 0 20.2 15.5Z" />
        </svg>
        <svg className="theme-toggle-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3.6" />
          <path d="M12 2.5v2M12 19.5v2M4.5 12h-2M21.5 12h-2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
        </svg>
      </span>
      <span className="theme-toggle-text" aria-hidden="true">
        <span className="theme-toggle-light-label">Modo escuro</span>
        <span className="theme-toggle-dark-label">Modo claro</span>
      </span>
    </button>
  );
}
