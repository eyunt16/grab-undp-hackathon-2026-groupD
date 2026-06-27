import { ChevronLeft, MapPin } from "lucide-react";
import Link from "next/link";

type AppHeaderProps = {
  backHref?: string;
  backLabel?: string;
  rightSlot?: React.ReactNode;
};

export function AppHeader({
  backHref = "/",
  backLabel = "Home",
  rightSlot,
}: AppHeaderProps) {
  return (
    <header className="border-b border-[#e3e8e4] bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="flex items-center gap-1 text-sm font-semibold text-[#64736b] hover:text-[#157347]"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{backLabel}</span>
          </Link>
          <span className="h-6 w-px bg-[#dde4df]" />
          <Link
            href="/"
            className="flex items-center gap-2 font-extrabold tracking-[-0.04em]"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#157347] text-white">
              <MapPin className="h-4 w-4" strokeWidth={2.5} />
            </span>
            EasyMove
          </Link>
        </div>
        {rightSlot}
      </div>
    </header>
  );
}
