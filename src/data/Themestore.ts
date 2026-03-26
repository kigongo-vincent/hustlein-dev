import { create } from "zustand";

const THEME_STORAGE_KEY = "hustle-in-theme";

export type themeMode = "dark" | "light";

export interface ThemeI {
  system: {
    background: string;
    foreground: string;
    border: string;
    error: string;
    success: string;
    dark: string;
    /** Optional CSS background-image value for the main content area (url, gradient, etc.) */
    backgroundImage?: string;
  };
  brand: {
    primary: string;
    secondary: string;
    /** Text/icon color on primary background (e.g. dark mode when primary is white) */
    onPrimary?: string;
  };
  accent?: {
    blue: string;
    purple: string;
    pink: string;
    green: string;
    yellow: string;
    teal: string;
  };
}

export type ThemeOverrides = {
  system?: Partial<ThemeI["system"]>;
  brand?: Partial<ThemeI["brand"]>;
  accent?: Partial<NonNullable<ThemeI["accent"]>>;
};

export interface ThemestoreI {
  current: ThemeI;
  mode: themeMode;
  customOverrides: ThemeOverrides | null;
  setTheme: (theme: themeMode) => void;
  setCustomTheme: (overrides: ThemeOverrides | null) => void;
  resetCustomTheme: () => void;
  getThemeByName: (theme: themeMode) => ThemeI;
}

/** Dark theme: white primary, muted white text, improved background hierarchy */
const darkTheme: ThemeI = {
  system: {
    background: "#0a0a0a",
    foreground: "#141414",
    border: "rgba(255,255,255,0.14)",
    error: "#ff6b6b",
    success: "#51cf66",
    dark: "#e0e0e0",
  },
  brand: {
    primary: "#ffffff",
    secondary: "#FF9600",
    onPrimary: "#0a0a0a",
  },
  accent: {
    blue: "#4DABF7",
    purple: "#B197FC",
    pink: "#F783AC",
    green: "#63E6BE",
    yellow: "#FFD43B",
    teal: "#38D9A9",
  },
};

const lightTheme: ThemeI = {
  system: {
    background: "#F4f4f4",
    foreground: "#f9f9f9",
    border: "rgba(0,0,0,0.1)",
    error: "red",
    success: "green",
    dark: "black",
  },
  brand: {
    secondary: "#FF9600",
    primary: "#682308",
  },
  accent: {
    blue: "#228BE6",
    purple: "#7950F2",
    pink: "#E64980",
    green: "#12B886",
    yellow: "#FAB005",
    teal: "#0CA678",
  },
};

function mergeTheme(base: ThemeI, overrides: ThemeOverrides | null): ThemeI {
  if (!overrides) return base;
  return {
    system: { ...base.system, ...overrides.system },
    brand: { ...base.brand, ...overrides.brand },
    accent: { ...base.accent, ...(overrides as any).accent },
  };
}

function loadStored(): { mode: themeMode; customOverrides: ThemeOverrides | null } {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return { mode: "light", customOverrides: null };
    const parsed = JSON.parse(raw) as { mode?: themeMode; customOverrides?: ThemeOverrides | null };
    return {
      mode: parsed.mode === "dark" ? "dark" : "light",
      customOverrides: parsed.customOverrides ?? null,
    };
  } catch {
    return { mode: "light", customOverrides: null };
  }
}

function saveStored(mode: themeMode, customOverrides: ThemeOverrides | null) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ mode, customOverrides }));
  } catch {
    // ignore
  }
}

const stored = loadStored();
const baseTheme = stored.mode === "dark" ? darkTheme : lightTheme;
const initialCurrent = mergeTheme(baseTheme, stored.customOverrides);

export const Themestore = create<ThemestoreI>((set, get) => ({
  current: initialCurrent,
  mode: stored.mode,
  customOverrides: stored.customOverrides,
  setTheme: (t: themeMode) => {
    const base = t === "dark" ? darkTheme : lightTheme;
    const merged = mergeTheme(base, get().customOverrides);
    saveStored(t, get().customOverrides);
    set({ current: merged, mode: t });
  },
  setCustomTheme: (overrides: ThemeOverrides | null) => {
    const base = get().mode === "dark" ? darkTheme : lightTheme;
    const merged = mergeTheme(base, overrides);
    saveStored(get().mode, overrides);
    set({ customOverrides: overrides, current: merged });
  },
  resetCustomTheme: () => {
    get().setCustomTheme(null);
  },
  getThemeByName: (t: themeMode): ThemeI => {
    const base = t === "dark" ? darkTheme : lightTheme;
    return mergeTheme(base, get().customOverrides);
  },
}));
