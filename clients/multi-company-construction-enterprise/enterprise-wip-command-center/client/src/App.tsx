import { useEffect } from "react";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, restoreSession, useSession } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Shell } from "@/components/shell";
import { useLiveSync, useBootstrap } from "@/lib/app";
import { LoginPage, ForceChange } from "@/pages/login";
import CommandPage from "@/pages/command";
import PortfolioPage from "@/pages/portfolio";
import DashboardsPage from "@/pages/dashboards";
import ProjectsPage from "@/pages/projects";
import ExceptionsPage from "@/pages/exceptions";
import MonthEndPage from "@/pages/monthend";
import BondsPage from "@/pages/bonds";
import IntakePage from "@/pages/intake";
import ClosePage from "@/pages/close";
import ForecastPage from "@/pages/forecast";
// import MgmtPage from "@/pages/mgmt"; // hidden until requested
import CashPage from "@/pages/cash";
import CapacityPage from "@/pages/capacity";
import PlanningPage from "@/pages/planning";
import PipelinePage from "@/pages/pipeline";
import RulesPage from "@/pages/rules";
import TeamPage from "@/pages/team";
import AuditPage from "@/pages/audit";
import RoadmapPage from "@/pages/roadmap";
import AccountPage from "@/pages/account";
import ChangesPage from "@/pages/changes";
import BriefPage from "@/pages/brief";
import GuidePage from "@/pages/guide";
import { Logo } from "@/components/shell";

function Loading() {
  return <div className="flex min-h-[100dvh] items-center justify-center"><div className="flex items-center gap-3 text-muted-foreground"><Logo className="h-8 w-8 animate-pulse text-foreground" /> Loading governed data…</div></div>;
}
function Authed() {
  useLiveSync();
  const b = useBootstrap();
  if (b.isLoading || !b.data) return <Loading />;
  return (
    <Shell>
      <Switch>
        <Route path="/" component={CommandPage} />
        <Route path="/portfolio" component={PortfolioPage} />
        <Route path="/dashboards" component={DashboardsPage} />
        <Route path="/projects" component={ProjectsPage} />
        <Route path="/exceptions" component={ExceptionsPage} />
        <Route path="/month-end" component={MonthEndPage} />
        <Route path="/bonds" component={BondsPage} />
        <Route path="/intake" component={IntakePage} />
        <Route path="/close" component={ClosePage} />
        <Route path="/forecast" component={ForecastPage} />
        <Route path="/cash" component={CashPage} />
        <Route path="/capacity" component={CapacityPage} />
        <Route path="/planning" component={PlanningPage} />
        <Route path="/pipeline" component={PipelinePage} />
        <Route path="/rules" component={RulesPage} />
        <Route path="/team" component={TeamPage} />
        <Route path="/audit" component={AuditPage} />
        <Route path="/roadmap" component={RoadmapPage} />
        <Route path="/account" component={AccountPage} />
        <Route path="/changes" component={ChangesPage} />
        <Route path="/brief" component={BriefPage} />
        <Route path="/guide" component={GuidePage} />
        <Route><CommandPage /></Route>
      </Switch>
    </Shell>
  );
}
function Gate() {
  const s = useSession();
  useEffect(() => { restoreSession(); }, []);
  if (!s.checked) return <Loading />;
  if (!s.user) return <LoginPage />;
  if (s.user.mustChange) return <ForceChange />;
  return <Authed />;
}
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router hook={useHashLocation}><Gate /></Router>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
