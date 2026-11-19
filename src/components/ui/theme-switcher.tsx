"use client";

import React, { useState } from "react";
import { Monitor, Sun, Moon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type Theme = "system" | "light" | "dark";

export interface ThemeSwitcherProps {
  value?: Theme;
  defaultValue?: Theme;
  onChange?: (theme: Theme) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const THEMES: { id: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "system", label: "System", icon: Monitor },
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  value,
  defaultValue = "dark",
  onChange,
  className,
  size = "sm",
}) => {
  const [internalTheme, setInternalTheme] = useState<Theme>(defaultValue);
  const currentTheme = value !== undefined ? value : internalTheme;

  const handleSelect = (theme: Theme) => {
    if (value === undefined) {
      setInternalTheme(theme);
    }
    onChange?.(theme);
  };

  const isDark = currentTheme === "dark";

  return (
    <div
      role="radiogroup"
      aria-label="Theme switcher"
      className={cn(
        "relative flex items-center rounded-full p-0.5 transition-colors border select-none shrink-0",
        isDark
          ? "bg-[#161b22] border-[#30363d] text-slate-400"
          : "bg-slate-100 border-slate-200 text-slate-500",
        className
      )}
    >
      {THEMES.map((t) => {
        const Icon = t.icon;
        const isSelected = currentTheme === t.id;

        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => handleSelect(t.id)}
            title={`${t.label} theme`}
            aria-label={`${t.label} theme`}
            className={cn(
              "relative z-10 flex items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500",
              size === "sm" ? "w-6 h-6" : size === "md" ? "w-8 h-8" : "w-9 h-9",
              isSelected
                ? isDark
                  ? "text-white"
                  : "text-slate-900"
                : isDark
                  ? "hover:text-slate-200 text-slate-400"
                  : "hover:text-slate-800 text-slate-500"
            )}
          >
            {isSelected && (
              <motion.span
                layoutId="theme-switcher-pill"
                className={cn(
                  "absolute inset-0 rounded-full shadow-xs pointer-events-none",
                  isDark
                    ? "bg-[#21262d] border border-[#30363d]"
                    : "bg-white border border-slate-200 shadow-sm"
                )}
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
              />
            )}
            <Icon
              className={cn(
                "relative z-20 shrink-0 transition-transform",
                size === "sm" ? "w-3.5 h-3.5" : size === "md" ? "w-4 h-4" : "w-4.5 h-4.5",
                isSelected && t.id === "light" && "text-amber-500 scale-105",
                isSelected && t.id === "dark" && "text-indigo-400 scale-105",
                isSelected && t.id === "system" && (isDark ? "text-sky-400 scale-105" : "text-blue-600 scale-105")
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSwitcher;
