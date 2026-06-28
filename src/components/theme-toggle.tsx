"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch by only rendering once mounted on the client
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-12 w-40 animate-pulse rounded-full bg-muted border border-border" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-12 min-w-40 items-center justify-center gap-2.5 px-4 py-2 rounded-full border-2 border-border bg-card text-sm font-extrabold text-foreground transition-all hover:bg-muted active:scale-95 shadow-sm focus:outline-hidden focus:ring-4 focus:ring-primary/20 cursor-pointer"
      aria-label={
        isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"
      }
    >
      {isDark ? (
        <>
          <Sun className="h-5 w-5 text-amber-500" strokeWidth={2.5} />
          <span>Giao diện Sáng</span>
        </>
      ) : (
        <>
          <Moon className="h-5 w-5 text-blue-600" strokeWidth={2.5} />
          <span>Giao diện Tối</span>
        </>
      )}
    </button>
  );
}
