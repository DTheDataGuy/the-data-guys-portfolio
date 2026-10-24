import { Link, useLocation } from "wouter";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/lib/theme";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/survey", label: "Take the Survey" },
  { href: "/diaspora", label: "About the Diaspora" },
  { href: "/methods", label: "How We Analyze" },
  { href: "/involved", label: "Get Involved" },
];

export function Wordmark({ small = false }: { small?: boolean }) {
  return (
    <span className="flex flex-col leading-none">
      <span className={cn("font-display tracking-tight", small ? "text-[17px]" : "text-[19px]")}>Seattle Black Diaspora</span>
      <span className="mt-1 text-[10.5px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Community Survey · 2026</span>
    </span>
  );
}

export function PublicLayout({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  const [loc] = useLocation();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === "/" ? loc === "/" : loc.startsWith(h));
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2">Skip to content</a>
      <div className="band" aria-hidden />
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur no-print">
        <div className="mx-auto flex h-[64px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="shrink-0" data-testid="link-home"><Wordmark /></Link>
          {!bare && (
            <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
              {NAV.slice(1).map((n) => (
                <Link key={n.href} href={n.href} className={cn("rounded-full px-3 py-1.5 text-[14px] font-medium transition-colors", active(n.href) ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")} data-testid={`nav-${n.href.slice(1)}`}>
                  {n.label}
                </Link>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {!bare && (
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-full hover-elevate lg:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu" data-testid="button-menu">
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>
        {open && (
          <nav className="border-t border-border bg-background px-4 pb-4 pt-2 lg:hidden" aria-label="Main mobile">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={cn("block rounded-lg px-3 py-3 text-[16px] font-medium", active(n.href) ? "bg-secondary" : "")}>{n.label}</Link>
            ))}
          </nav>
        )}
      </header>
      <main id="main" className="flex-1">{children}</main>
      <footer className="border-t border-border bg-card/50 no-print">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Wordmark small />
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-muted-foreground">An information-gathering process led by the Seattle Department of Neighborhoods in conjunction with the Seattle City Council.</p>
          </div>
          <div className="text-[14px]">
            <p className="eyebrow mb-3">Participate</p>
            <ul className="space-y-2">
              <li><Link href="/survey" className="hover:text-primary">Take the survey</Link></li>
              <li><Link href="/involved" className="hover:text-primary">Join a listening session</Link></li>
              <li><Link href="/diaspora" className="hover:text-primary">About the Black diaspora</Link></li>
            </ul>
          </div>
          <div className="text-[14px]">
            <p className="eyebrow mb-3">Trust</p>
            <ul className="space-y-2">
              <li><Link href="/methods" className="hover:text-primary">How we analyze the data</Link></li>
              <li><Link href="/privacy" className="hover:text-primary">Privacy statement</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PageHero({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <section className="grain border-b border-border/70">
      <div className="mx-auto max-w-4xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16">
        <p className="eyebrow text-terra" style={{ color: "hsl(var(--terra))" }}>{eyebrow}</p>
        <h1 className="mt-3 font-display text-[34px] leading-[1.08] sm:text-[46px]">{title}</h1>
        {children && <div className="mt-4 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">{children}</div>}
      </div>
    </section>
  );
}
