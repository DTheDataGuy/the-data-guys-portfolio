import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Landmark,
  ArrowLeftRight,
  HeartHandshake,
  ClipboardList,
  Store,
  Users,
  MessageSquareHeart,
  HandCoins,
  LineChart,
  PencilLine,
  Inbox,
  UploadCloud,
  BookOpen,
  FileBarChart,
  Settings2,
  LifeBuoy,
  Menu,
  Moon,
  Sun,
  FlaskConical,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useApp, ROLE_LABEL, DOMAIN_READ, type Role } from "@/lib/app-state";
import { cn } from "@/lib/utils";
import { CLIENT_REVIEW } from "@shared/release";

type NavItem = { href: string; label: string; icon: any; domain?: string; roles?: Role[] };
const NAV: { group: string; items: NavItem[] }[] = [
  { group: "Overview", items: [{ href: "/", label: "Executive overview", icon: LayoutDashboard, roles: ["admin", "lending", "program", "finance", "leadership"] }] },
  {
    group: "Lending",
    items: [
      { href: "/lending", label: "Lending portfolio", icon: Landmark, domain: "lending" },
      { href: "/ned", label: "NED migration", icon: ArrowLeftRight, domain: "lending" },
    ],
  },
  {
    group: "Programs & community",
    items: [
      { href: "/impact", label: "Programs & impact", icon: HeartHandshake, domain: "impact" },
      { href: "/crp", label: "CRP reporting", icon: ClipboardList, domain: "crp" },
      { href: "/crsp", label: "CRSP services", icon: Store, domain: "crsp" },
      { href: "/engagement", label: "Community & engagement", icon: Users, domain: "engagement" },
      { href: "/surveys", label: "Surveys & journeys", icon: MessageSquareHeart, domain: "surveys" },
    ],
  },
  {
    group: "Money",
    items: [
      { href: "/fundraising", label: "Fundraising", icon: HandCoins, domain: "fundraising" },
      { href: "/finance", label: "Finance", icon: LineChart, domain: "finance" },
    ],
  },
  {
    group: "Data operations",
    items: [
      { href: "/entry", label: "Enter data", icon: PencilLine, roles: ["admin", "lending", "program", "finance"] },
      { href: "/review", label: "Review queue", icon: Inbox, roles: ["admin", "lending", "program", "finance", "leadership"] },
      { href: "/imports", label: "Import & reconcile", icon: UploadCloud, roles: ["admin", "lending", "program", "finance", "leadership"] },
      { href: "/dictionary", label: "Data dictionary", icon: BookOpen, roles: ["admin", "lending", "program", "finance", "leadership"] },
    ],
  },
  {
    group: "Reporting & governance",
    items: [
      { href: "/reports", label: "Reports & exports", icon: FileBarChart },
      { href: "/admin", label: "Administration", icon: Settings2, roles: ["admin", "leadership"] },
      { href: "/guide", label: "Operating guide", icon: LifeBuoy },
    ],
  },
];

export function allowed(item: NavItem, role: Role) {
  if (item.roles) return item.roles.includes(role);
  if (item.domain) return DOMAIN_READ[item.domain].includes(role);
  return true;
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const [loc] = useLocation();
  const { role } = useApp();
  const { data: meta } = useQuery<any>({ queryKey: ["/api/meta", { _r: role }] });
  const pending = (meta?.queue ?? []).filter((q: any) => q.status === "submitted").reduce((a: number, q: any) => a + q.n, 0);
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
      {NAV.map((g) => {
        const items = g.items.filter((i) => allowed(i, role) &&
          (!CLIENT_REVIEW || !["/entry", "/review", "/imports", "/admin", "/dictionary"].includes(i.href)));
        if (!items.length) return null;
        return (
          <div key={g.group}>
            <div className="mb-1.5 px-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--sidebar-foreground)/0.55)]">{g.group}</div>
            <div className="space-y-0.5">
              {items.map((i) => {
                const active = loc === i.href;
                const I = i.icon;
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    onClick={onNavigate}
                    data-testid={`nav-${i.href.replace("/", "") || "overview"}`}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[14px] transition-colors",
                      active ? "bg-[hsl(var(--sidebar-accent))] font-semibold text-[hsl(var(--sidebar-accent-foreground))] shadow-[inset_3px_0_0_hsl(var(--sidebar-primary))]" : "text-[hsl(var(--sidebar-foreground)/0.85)] hover:bg-[hsl(var(--sidebar-accent)/0.6)] hover:text-[hsl(var(--sidebar-foreground))]",
                    )}
                  >
                    <I className={cn("h-4 w-4 shrink-0", active ? "text-[hsl(var(--sidebar-primary))]" : "opacity-80")} />
                    <span className="truncate">{CLIENT_REVIEW && i.href === "/guide" ? "Data readiness" : i.label}</span>
                    {i.href === "/review" && pending > 0 && <span className="ml-auto rounded-full bg-[hsl(var(--sidebar-primary))] px-1.5 text-[11px] font-bold text-[hsl(var(--sidebar-primary-foreground))]">{pending}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]">
      <div className="px-5 pb-4 pt-5">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-3" data-testid="brand-home">
          <span className="brand-mark h-9 w-9 text-[hsl(var(--sidebar-primary))]" aria-hidden />
          <div className="leading-tight">
            <div className="font-serif text-[1.15rem] font-bold tracking-wide">Denkyem</div>
            <div className="text-[11px] text-[hsl(var(--sidebar-foreground)/0.65)]">Operations · Lending · Impact</div>
          </div>
        </Link>
      </div>
      <div className="kente-rule mx-5 mb-4 rounded-full opacity-90" />
      <NavList onNavigate={onNavigate} />
      <div className="border-t border-[hsl(var(--sidebar-border))] px-5 py-3 text-[11px] leading-snug text-[hsl(var(--sidebar-foreground)/0.6)]">
        Adaptability · Resilience · Community wealth
      </div>
    </div>
  );
}

export function DemoBanner() {
  const { demo, setDemo } = useApp();
  if (!demo) return null;
  return (
    <div className="demo-stripe border-b border-[hsl(43_96%_50%/0.5)] px-4 py-1.5 text-center text-[12.5px] font-medium text-[hsl(35_70%_22%)] dark:text-[hsl(43_96%_75%)] no-print" data-testid="demo-banner">
      <FlaskConical className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px" />
      Demonstration data — fictitious values, not Denkyem results.{" "}
      <button className="underline underline-offset-2 hover:no-underline" onClick={() => setDemo(false)} data-testid="button-switch-production">
        Switch to production data
      </button>
    </div>
  );
}

export function FilterBar() {
  const { filters, setFilters, role } = useApp();
  const { data: opt } = useQuery<any>({ queryKey: ["/api/options", { _r: role }] });
  const [open, setOpen] = useState(false);
  const months = filters.year ? Array.from({ length: 12 }, (_, i) => `${filters.year}-${String(i + 1).padStart(2, "0")}`) : [];
  const set = (k: string, v: string) => {
    const n: any = { ...filters, [k]: v === "all" ? undefined : v };
    if (k === "year") n.month = undefined;
    setFilters(n);
  };
  const active = Object.values(filters).filter(Boolean).length;
  const sel = (k: string, label: string, opts: { v: string; l: string }[], disabled = false) => (
    <Select value={(filters as any)[k] ?? "all"} onValueChange={(v) => set(k, v)} disabled={disabled}>
      <SelectTrigger className="h-8 w-full min-w-[120px] text-[13px] md:w-auto" data-testid={`filter-${k}`}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label.toLowerCase()}</SelectItem>
        {opts.map((o) => (
          <SelectItem key={o.v} value={o.v}>
            {o.l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  const controls = (
    <>
      {sel("year", "Years", (opt?.years ?? []).map((y: string) => ({ v: y, l: y })))}
      {sel("month", "Months", months.map((m) => ({ v: m, l: new Date(m + "-15").toLocaleString("en-US", { month: "long" }) })), !filters.year)}
      {sel("program", "Programs", (opt?.programs ?? []).map((p: any) => ({ v: p.id, l: p.name })))}
      {sel("county", "Counties", (opt?.counties ?? []).map((c: string) => ({ v: c, l: `${c} County` })))}
      {!!opt?.funds?.length && sel("fund", "Funds", opt.funds.map((c: string) => ({ v: c, l: c })))}
      {!!opt?.risks?.length && sel("risk", "Risk levels", opt.risks.map((c: string) => ({ v: c, l: c[0].toUpperCase() + c.slice(1) })))}
      {sel("participantCategory", "Participant types", (opt?.participantCategories ?? []).map((c: string) => ({ v: c, l: c })))}
      {active > 0 && (
        <Button variant="ghost" size="sm" className="h-8 text-[13px]" onClick={() => setFilters({})} data-testid="button-clear-filters">
          <X className="mr-1 h-3.5 w-3.5" /> Clear
        </Button>
      )}
    </>
  );
  return (
    <>
      <div className="hidden flex-wrap items-center gap-2 lg:flex">{controls}</div>
      <div className="lg:hidden">
        <Button variant="outline" size="sm" className="h-8" onClick={() => setOpen(!open)} data-testid="button-filters-mobile">
          <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" /> Filters{active ? ` (${active})` : ""}
        </Button>
      </div>
      {open && <div className="col-span-full grid grid-cols-2 gap-2 pt-2 lg:hidden">{controls}</div>}
    </>
  );
}

export function Shell({ children, hideFilters }: { children: ReactNode; hideFilters?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { role, setRole, demo, setDemo, dark, setDark } = useApp();
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 lg:block">
        <SidebarBody />
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[270px] border-0 p-0">
          <SidebarBody onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur no-print">
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 md:px-6">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation" data-testid="button-menu">
              <Menu className="h-5 w-5" />
            </Button>
            <span className="brand-mark h-6 w-6 text-primary lg:hidden" aria-hidden />
            <div className="min-w-0 flex-1">{!CLIENT_REVIEW && !hideFilters && role !== "funder" && <FilterBar />}</div>
            <div className="flex items-center gap-2">
              {!CLIENT_REVIEW && <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="h-8 w-[178px] text-[13px]" data-testid="select-role" aria-label="Viewing as role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>}
              {CLIENT_REVIEW && <span className="text-xs text-muted-foreground">Denkyem reporting</span>}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDark(!dark)} aria-label="Toggle dark mode" data-testid="button-theme">
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6 md:py-7">{children}</main>
        <footer className="border-t px-6 py-4 text-[11.5px] text-muted-foreground no-print">
          Denkyem Co-op · Seattle, Washington · Built for Denkyem by The Data Guys.
        </footer>
      </div>
    </div>
  );
}
