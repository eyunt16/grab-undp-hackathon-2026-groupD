import { ArrowRight, HeartHandshake, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8f5] text-[#17231d]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_18%_18%,rgba(126,211,170,0.25),transparent_34%),radial-gradient(circle_at_82%_5%,rgba(255,197,110,0.24),transparent_32%)]" />

      <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="EasyMove home"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#157347] text-white shadow-[0_8px_24px_rgba(21,115,71,0.22)]">
            <MapPin className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="text-xl font-extrabold tracking-[-0.04em]">
            EasyMove
          </span>
        </Link>
        <Link
          href="/guardian"
          className="rounded-full border border-[#d9e1dc] bg-white/80 px-4 py-2 text-sm font-semibold text-[#405149] transition hover:border-[#157347] hover:text-[#157347]"
        >
          Guardian sign in
        </Link>
      </header>

      <section className="relative mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-7xl items-center gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#cfe4d8] bg-white/70 px-3 py-1.5 text-sm font-semibold text-[#157347] shadow-sm backdrop-blur">
            <ShieldCheck className="h-4 w-4" />
            Simple rides, shared peace of mind
          </div>
          <h1 className="text-balance text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Get there safely.
            <span className="block text-[#157347]">Keep family close.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#5c6c64] sm:text-xl">
            An easier way to book a trusted ride, with live trip updates for the
            people who care about you.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href="/ride"
              className="group rounded-[1.75rem] bg-[#157347] p-6 text-white shadow-[0_18px_50px_rgba(21,115,71,0.24)] transition hover:-translate-y-1 hover:bg-[#11623c]"
            >
              <span className="mb-8 grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
                <MapPin className="h-6 w-6" />
              </span>
              <span className="block text-2xl font-bold tracking-tight">
                I need a ride
              </span>
              <span className="mt-2 flex items-center justify-between text-sm text-white/80">
                Book in a few simple steps
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href="/guardian"
              className="group rounded-[1.75rem] border border-[#dce4df] bg-white p-6 shadow-[0_18px_50px_rgba(29,48,38,0.07)] transition hover:-translate-y-1 hover:border-[#a9cbb8]"
            >
              <span className="mb-8 grid h-12 w-12 place-items-center rounded-2xl bg-[#edf7f1] text-[#157347]">
                <HeartHandshake className="h-6 w-6" />
              </span>
              <span className="block text-2xl font-bold tracking-tight">
                I’m a guardian
              </span>
              <span className="mt-2 flex items-center justify-between text-sm text-[#6a7971]">
                Follow and support a trip
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
          <p className="mt-7 text-sm text-[#7b8982]">
            No account needed for this demo.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:mr-0">
          <div className="absolute -inset-6 -rotate-3 rounded-[3rem] bg-[#dfeddf]" />
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white bg-[#20372c] p-7 text-white shadow-[0_32px_80px_rgba(25,55,40,0.22)] sm:p-9">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Today’s ride</p>
                <p className="mt-1 text-2xl font-bold">Home → Family clinic</p>
              </div>
              <span className="h-3 w-3 rounded-full bg-[#83e3ad] shadow-[0_0_0_7px_rgba(131,227,173,0.13)]" />
            </div>
            <div className="relative my-10 h-48 overflow-hidden rounded-[1.75rem] bg-[#dce8dc]">
              <div className="absolute inset-0 opacity-55 [background-image:linear-gradient(28deg,transparent_46%,#a9bcae_47%,#a9bcae_50%,transparent_51%),linear-gradient(105deg,transparent_48%,#bac9bd_49%,#bac9bd_52%,transparent_53%)] [background-size:85px_72px,110px_92px]" />
              <div className="absolute left-[18%] top-[62%] h-4 w-4 rounded-full border-4 border-white bg-[#157347] shadow-lg" />
              <div className="absolute right-[18%] top-[25%] grid h-9 w-9 place-items-center rounded-full bg-[#f4a340] text-[#20372c] shadow-lg">
                <MapPin className="h-5 w-5" fill="currentColor" />
              </div>
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 420 190"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M82 130C132 118 144 66 215 80C280 92 287 53 340 48"
                  stroke="#157347"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="8 9"
                />
              </svg>
            </div>
            <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f4a340] text-lg font-black text-[#20372c]">
                ML
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">Mai Lan is on the way</p>
                <p className="mt-0.5 text-sm text-white/60">
                  Driver arrives in 4 minutes
                </p>
              </div>
              <ShieldCheck className="h-6 w-6 text-[#83e3ad]" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
