import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, X, BarChart3, LayoutDashboard, Layers, Table2, AlertTriangle, Scale, ShieldCheck, Inbox, CheckCircle2, TrendingUp, Wallet, Gauge, Target, GitBranch, BookOpen, Users, History, Map, Menu, LogOut, KeyRound, FilterX, Download, GitCompareArrows, FileText, Compass } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/lib/theme";
import { api, download, setSession, useSession } from "@/lib/queryClient";
import { setUI, useUI, usePeriod, useBootstrap, filtersActive, backFilters, clearFilters } from "@/lib/app";
import { Pill } from "./kit";
import { ProjectDrawerHost } from "./project";
import { cn } from "@/lib/utils";

export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-label="Enterprise WIP Command Center" role="img" fill="none">
      <rect x="1" y="1" width="38" height="38" rx="9" stroke="currentColor" strokeOpacity=".35" strokeWidth="1.5" />
      <path d="M10 29V19M17 29V13M24 29V17M31 29V9" stroke="hsl(var(--sidebar-primary))" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M8.5 31.5h23" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export const NAV: { group: string; items: { href: string; label: string; icon: any }[] }[] = [
  { group: "Overview", items: [
    { href: "/", label: "Command Center", icon: LayoutDashboard },
    { href: "/dashboards", label: "Dashboards", icon: BarChart3 },
    { href: "/portfolio", label: "Portfolio Explorer", icon: Layers },
    { href: "/projects", label: "Projects", icon: Table2 },
  ] },
  { group: "Govern", items: [
    { href: "/exceptions", label: "Exceptions", icon: AlertTriangle },
    { href: "/month-end", label: "Month-End Exceptions", icon: Scale },
    { href: "/bonds", label: "Bond Center", icon: ShieldCheck },
  ] },
  { group: "Monthly cycle", items: [
    { href: "/intake", label: "WIP Intake", icon: Inbox },
    { href: "/changes", label: "What Changed", icon: GitCompareArrows },
    { href: "/close", label: "Close & Publish", icon: CheckCircle2 },
    { href: "/brief", label: "Executive Brief", icon: FileText },
  ] },
  { group: "Plan", items: [
    { href: "/forecast", label: "Backlog & Forecast", icon: TrendingUp },
    // Management forecast page is built but hidden until Executive asks for it (see pages/mgmt.tsx, route "/management").
    { href: "/cash", label: "Cash Flow", icon: Wallet },
    { href: "/capacity", label: "Bond Capacity", icon: Gauge },
    { href: "/planning", label: "Executive Planning", icon: Target },
    { href: "/pipeline", label: "Bid Pipeline", icon: GitBranch },
  ] },
  { group: "Reference", items: [
    { href: "/guide", label: "Start Here", icon: Compass },
    { href: "/rules", label: "Rules & Formulas", icon: BookOpen },
    { href: "/team", label: "Team & Access", icon: Users },
    { href: "/audit", label: "Audit Trail", icon: History },
    { href: "/roadmap", label: "Roadmap", icon: Map },
  ] },
];

function SideNav({ onNav }: { onNav?: () => void }) {
  const [loc] = useLocation();
  return (
    <nav className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-4 pb-4 pt-5">
        <Logo className="h-9 w-9 text-white" />
        <div className="min-w-0 leading-tight">
          <div className="text-[14px] font-semibold text-white">Enterprise WIP</div>
          <div className="text-[11.5px] text-sidebar-foreground/70">Command Center</div>
        </div>
      </div>
      <div className="scroll-thin flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((g) => (
          <div key={g.group} className="mt-3">
            <div className="px-3 pb-1 text-[10.5px] font-semibold uppercase tracking-[.08em] text-sidebar-foreground/50">{g.group}</div>
            {g.items.map((it) => {
              const active = it.href === "/" ? loc === "/" : loc.startsWith(it.href);
              const I = it.icon;
              return (
                <Link key={it.href} href={it.href} onClick={onNav}
                  className={cn("relative flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13.5px] transition-colors", active ? "sidebar-active bg-white/[.09] font-medium text-white" : "text-sidebar-foreground/80 hover:bg-white/[.05] hover:text-white")} data-testid={`nav-${it.href.replace("/", "") || "home"}`}>
                  <I className={cn("h-4 w-4 shrink-0", active ? "text-[hsl(var(--sidebar-primary))]" : "opacity-80")} />
                  <span className="truncate">{it.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <SideStatus />
      <div className="border-t border-sidebar-border px-4 py-3 text-[11px] leading-4 text-sidebar-foreground/55">Governed data · server-side · every change audited</div>
    </nav>
  );
}

function SideStatus() {
  const { period } = usePeriod();
  if (!period) return null;
  const st = period.status; const c = st === "published" ? "bg-emerald-400" : st === "review" ? "bg-[hsl(var(--sidebar-primary))]" : "bg-amber-400";
  return (
    <Link href="/close" className="mx-3 mb-3 block rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 transition-colors hover:bg-white/[.08]" data-testid="link-side-status">
      <div className="text-[10.5px] font-semibold uppercase tracking-[.08em] text-sidebar-foreground/50">Reporting month</div>
      <div className="mt-0.5 flex items-center justify-between gap-2">
        <span className="truncate text-[13.5px] font-medium text-white">{period.label}</span>
        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-sidebar-foreground/80"><span className={cn("h-1.5 w-1.5 rounded-full", c)} />{statusLabel(st)}</span>
      </div>
    </Link>
  );
}

const statusTone = (s?: string) => (s === "published" ? "ok" : s === "review" ? "gold" : "warn") as any;
export const statusLabel = (s?: string) => (s === "published" ? "Published" : s === "review" ? "In review" : "Draft");

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { period, periods } = usePeriod(); const ui = useUI(); const boot = useBootstrap().data; const s = useSession();
  const ents = boot?.entities || [];
  const bus = [...new Set(ents.map((e) => e.bu))].sort();
  const f = ui.filters;
  const setF = (p: Partial<typeof f>) => setUI({ filters: { ...f, ...p } });
  return (
    <header className="print:hidden sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 md:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open menu" data-testid="button-menu"><Menu /></Button>
        <div className="flex items-center gap-2">
          <Select value={period?.id || ""} onValueChange={(v) => setUI({ period: v })}>
            <SelectTrigger className="h-9 w-[170px] font-medium" data-testid="select-period"><SelectValue placeholder="Period" /></SelectTrigger>
            <SelectContent>{periods.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
          {period ? <Pill tone={statusTone(period.status)}>{statusLabel(period.status)}{period.status === "published" ? ` · v${period.version}` : ""}</Pill> : null}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Select value={f.bu} onValueChange={(v) => setF({ bu: v })}>
            <SelectTrigger className="h-9 w-[170px]" data-testid="select-bu"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All business units</SelectItem>{bus.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={f.entity} onValueChange={(v) => setF({ entity: v })}>
            <SelectTrigger className="h-9 w-[150px]" data-testid="select-entity"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All entities</SelectItem>{ents.filter((e) => f.bu === "all" || e.bu === f.bu).map((e) => <SelectItem key={e.code} value={e.code}>{e.code} · {e.company}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={f.kind} onValueChange={(v) => setF({ kind: v as any })}>
            <SelectTrigger className="h-9 w-[140px]" data-testid="select-kind"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Operating + JV</SelectItem><SelectItem value="Operating">Operating only</SelectItem><SelectItem value="JV">JV entities</SelectItem></SelectContent>
          </Select>
          {filtersActive(f) ? <Button variant="ghost" size="sm" onClick={() => setUI({ filters: { bu: "all", entity: "all", company: "all", kind: "all" } })} data-testid="button-clear-filters"><FilterX /> Clear</Button> : null}
        </div>
        <div className="ml-auto flex items-center gap-1">
          {period ? <Button variant="ghost" size="sm" onClick={() => download(`/api/periods/${period.id}/export.xlsx`, `Enterprise_WIP_${period.id}.xlsx`)} data-testid="button-export" className="hidden sm:inline-flex"><Download /> Export</Button> : null}
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 flex h-9 items-center gap-2 rounded-full border pl-1 pr-3 hover-elevate" data-testid="button-user">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">{(s.user?.name || "?").split(" ").map((x) => x[0]).slice(0, 2).join("")}</span>
                <span className="hidden text-[13px] font-medium sm:inline">{s.user?.name.split(" ")[0]}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel><div className="text-sm">{s.user?.name}</div><div className="text-xs font-normal text-muted-foreground">{s.user?.roleLabel}</div></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href="/account"><KeyRound className="mr-2 h-4 w-4" /> Change password</Link></DropdownMenuItem>
              <DropdownMenuItem onClick={async () => { try { await api("POST", "/api/auth/logout"); } catch {} setSession("", null); }} data-testid="button-logout"><LogOut className="mr-2 h-4 w-4" /> Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 pb-2.5 md:hidden">
        <Select value={f.bu} onValueChange={(v) => setF({ bu: v })}>
          <SelectTrigger className="h-8 w-[150px] shrink-0 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All business units</SelectItem>{bus.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={f.entity} onValueChange={(v) => setF({ entity: v })}>
          <SelectTrigger className="h-8 w-[130px] shrink-0 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All entities</SelectItem>{ents.map((e) => <SelectItem key={e.code} value={e.code}>{e.code}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <FilterStrip />
    </header>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-[100dvh]">
      <aside className="sticky top-0 hidden h-[100dvh] w-[244px] shrink-0 lg:block print:!hidden"><SideNav /></aside>
      <Sheet open={open} onOpenChange={setOpen}><SheetContent side="left" className="w-[260px] border-0 p-0"><SideNav onNav={() => setOpen(false)} /></SheetContent></Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        <ProjectDrawerHost />
      </div>
    </div>
  );
}

/** Always-visible drill-in bar: shows what the view is narrowed to, with one-click Back and per-filter remove. */
function FilterStrip() {
  const ui = useUI(); const boot = useBootstrap().data; const f = ui.filters;
  if (!filtersActive(f)) return null;
  const ent = boot?.entities.find((e) => e.code === f.entity);
  const chips: { k: keyof typeof f; label: string }[] = [];
  if (f.bu !== "all") chips.push({ k: "bu", label: `Business unit: ${f.bu}` });
  if (f.entity !== "all") chips.push({ k: "entity", label: `Entity: ${f.entity}${ent ? ` · ${ent.company}` : ""}` });
  if (f.company !== "all") chips.push({ k: "company", label: `Company: ${f.company}` });
  if (f.kind !== "all") chips.push({ k: "kind", label: f.kind === "JV" ? "JV entities only" : "Operating only" });
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-primary/15 bg-primary/[0.06] px-4 py-2 md:px-6" data-testid="filter-strip">
      <Button size="sm" variant="outline" className="h-7 bg-background" onClick={backFilters} data-testid="button-filter-back"><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
      <span className="text-[12px] font-medium text-muted-foreground">Viewing</span>
      {chips.map((c) => (
        <span key={c.k} className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-background py-0.5 pl-2.5 pr-1 text-[12px] font-medium">
          {c.label}
          <button aria-label={`Remove ${c.label}`} className="rounded-full p-0.5 hover:bg-muted" onClick={() => setUI({ filters: { ...f, [c.k]: "all" } })} data-testid={`chip-remove-${c.k}`}><X className="h-3 w-3" /></button>
        </span>
      ))}
      <button className="ml-auto text-[12px] font-medium text-primary hover:underline" onClick={clearFilters} data-testid="button-filter-all">Show everything</button>
    </div>
  );
}
