"use client";

import { createContext } from "react";

export const ThemeContext = createContext<{ isDarkMode: boolean }>({
  isDarkMode: true,
});
