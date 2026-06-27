import { ChevronLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

type AppHeaderProps = {
  backHref?: string;
  backLabel?: string;
  rightSlot?: React.ReactNode;
};

export function AppHeader({
  backHref = "/",
  backLabel = "Trang chủ",
  rightSlot,
}: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-card/90 backdrop-blur-xl text-foreground transition-colors duration-200">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-base font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="hidden sm:inline">{backLabel}</span>
          </Link>
          <span className="h-6 w-px bg-border" />
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
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {rightSlot}
        </div>
      </div>
    </header>
  );
}
