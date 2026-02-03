import React from "react";
import { Switch } from "@mui/material";
import { useThemeStore } from "../store/theme";

const ThemeToggle = () => {
  const { darkMode, toggleTheme } = useThemeStore();

  return <Switch checked={darkMode} onChange={toggleTheme} />;
};

export default ThemeToggle;
