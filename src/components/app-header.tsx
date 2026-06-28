"use client";

import { ChevronLeft, MapPin, Menu, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import * as React from "react";
import { ThemeToggle } from "@/components/theme-toggle";

type AppHeaderProps = {
  backHref?: string;
  backLabel?: string;
  rightSlot?: React.ReactNode;
  mobileDrawerSlot?: React.ReactNode;
};

export function AppHeader({
  backHref,
  backLabel,
  rightSlot,
  mobileDrawerSlot,
}: AppHeaderProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  return (
    <>
      <header className="border-b border-border bg-card/90 backdrop-blur-xl text-foreground transition-colors duration-200">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-4">
            {backHref && backLabel && (
              <>
                <Link
                  href={backHref}
                  className="flex items-center gap-1.5 text-base font-bold text-muted-foreground hover:text-primary transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span className="hidden sm:inline">{backLabel}</span>
                </Link>
                <span className="h-6 w-px bg-border" />
              </>
            )}
            <Link
              href="/"
              className="flex items-center gap-2.5 font-extrabold tracking-[-0.04em] text-2xl"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                <MapPin className="h-5 w-5" strokeWidth={2.5} />
              </span>
              AloXe
            </Link>
          </div>

          {/* Desktop right slot */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {rightSlot}
          </div>
          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-all"
            aria-label="Mở menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Sidebar panel */}
          <aside className="fixed right-0 top-0 z-50 flex h-full w-[min(320px,90vw)] flex-col bg-card shadow-2xl md:hidden animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <Link
                href="/"
                className="flex items-center gap-2 font-extrabold tracking-tight text-xl"
                onClick={() => setDrawerOpen(false)}
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <MapPin className="h-4 w-4" strokeWidth={2.5} />
                </span>
                AloXe
              </Link>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                aria-label="Đóng menu"
                onClick={() => setDrawerOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-3">
              {/* Theme toggle */}
              <DrawerThemeToggle />
              {/* Page-specific items */}
              {mobileDrawerSlot && (
                <>
                  <div className="my-4 h-px bg-border" />
                  {mobileDrawerSlot}
                </>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}

/** Compact theme toggle for the mobile drawer */
function DrawerThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted)
    return <div className="h-12 w-full animate-pulse rounded-2xl bg-muted" />;
  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-3.5 text-sm font-bold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-amber-500" strokeWidth={2.5} />
      ) : (
        <Moon className="h-5 w-5 text-blue-600" strokeWidth={2.5} />
      )}
      {isDark ? "Giao diện Sáng" : "Giao diện Tối"}
    </button>
  );
}
