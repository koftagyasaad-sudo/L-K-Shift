"use client";

import React, { createContext } from "react";

export const ThemeContext = createContext<{ isDarkMode: boolean }>({
  isDarkMode: true,
});
