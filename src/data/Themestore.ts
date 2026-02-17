import { create } from "zustand";
export type themeMode = "dark" | "light";
export interface ThemestoreI {
  current: ThemeI;
  setTheme: (theme: themeMode) => void;
  getThemeByName: (theme: themeMode) => ThemeI;
}

interface ThemeI {
  system: {
    background: string;
    foreground: string;
    error: string;
    success: string;
    dark: string;
  };
  brand: {
    primary: string;
    secondary: string;
  };
}

const darkTheme: ThemeI = {
  system: {
    background: "#FFFAF2",
    foreground: "#ffffff",
    error: "red",
    success: "green",
    dark: "black",
  },
  brand: {
    primary: "",
    secondary: "",
  },
};
const lightTheme: ThemeI = {
  system: {
    background: "#F4f4f4",
    foreground: "#f9f9f9",
    error: "red",
    success: "green",
    dark: "black",
  },
  brand: {
    secondary: "#FF9600",
    primary: "#682308",
  },
};

export const Themestore = create<ThemestoreI>((set, get) => ({
  current: lightTheme,
  setTheme: (t: themeMode) => {
    set({ ...get(), current: get().getThemeByName(t) });
  },
  getThemeByName: (t: themeMode): ThemeI => {
    return t == "dark" ? darkTheme : lightTheme;
  },
}));
