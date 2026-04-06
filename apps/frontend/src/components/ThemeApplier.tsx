"use client";

import { useEffect } from "react";
import { useThemeStore, resolveEffectiveTheme } from "@/store/theme";

export default function ThemeApplier() {
  const pref = useThemeStore((s) => s.preference);
  useEffect(() => {
    const effective = resolveEffectiveTheme(pref);
    const root = document.documentElement;
    if (effective === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [pref]);
  return null;
}

