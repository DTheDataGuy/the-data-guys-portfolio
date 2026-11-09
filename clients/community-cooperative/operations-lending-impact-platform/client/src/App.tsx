import { useEffect } from "react";
import { Switch, Route, Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppStateProvider, useApp } from "@/lib/app-state";
import { Shell } from "@/components/shell";
import NotFound from "@/pages/not-found";
import Overview from "@/pages/overview";
import Lending from "@/pages/lending";
import Ned from "@/pages/ned";
import Impact from "@/pages/impact";
import Crp from "@/pages/crp";
import Crsp from "@/pages/crsp";
import Engagement from "@/pages/engagement";
import Surveys from "@/pages/surveys";
import Fundraising from "@/pages/fundraising";
import Finance from "@/pages/finance";
import Entry from "@/pages/entry";
import Review from "@/pages/review";
import Imports from "@/pages/imports";
import Dictionary from "@/pages/dictionary";
import Reports from "@/pages/reports";
import Admin from "@/pages/admin";
import Guide from "@/pages/guide";
import { CLIENT_REVIEW } from "@shared/release";
import { AREAS, DataGate, ReadinessHome, ReadinessGuide } from "@/components/data-readiness";

const NO_FILTERS = ["/entry", "/review", "/imports", "/dictionary", "/admin", "/guide", "/ned", "/reports", "/surveys"];

function AppRouter() {
  const { role } = useApp();
  const [loc, setLoc] = useLocation();
  useEffect(() => {
    if (role === "funder" && loc !== "/reports") setLoc("/reports");
  }, [role, loc, setLoc]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc]);
  return (
    <Shell hideFilters={NO_FILTERS.includes(loc)}>
      {CLIENT_REVIEW && loc === "/" ? <ReadinessHome /> :
      CLIENT_REVIEW && (loc === "/guide" || ["/entry", "/review", "/imports", "/admin", "/dictionary"].includes(loc)) ? <ReadinessGuide /> :
      <DataGate path={loc}>
      <Switch>
        <Route path="/" component={Overview} />
        <Route path="/lending" component={Lending} />
        <Route path="/ned" component={Ned} />
        <Route path="/impact" component={Impact} />
        <Route path="/crp" component={Crp} />
        <Route path="/crsp" component={Crsp} />
        <Route path="/engagement" component={Engagement} />
        <Route path="/surveys" component={Surveys} />
        <Route path="/fundraising" component={Fundraising} />
        <Route path="/finance" component={Finance} />
        <Route path="/entry" component={Entry} />
        <Route path="/review" component={Review} />
        <Route path="/imports" component={Imports} />
        <Route path="/dictionary" component={Dictionary} />
        <Route path="/reports" component={Reports} />
        <Route path="/admin" component={Admin} />
        <Route path="/guide" component={Guide} />
        <Route component={NotFound} />
      </Switch>
      </DataGate>}
    </Shell>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppStateProvider>
          <Router hook={useHashLocation}>
            <AppRouter />
          </Router>
          <Toaster />
        </AppStateProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
