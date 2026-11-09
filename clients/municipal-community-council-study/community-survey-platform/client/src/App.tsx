import { Switch, Route, Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import SurveyPage from "@/pages/survey";
import { Diaspora, Methods, Privacy } from "@/pages/info";
import { Involved } from "@/pages/involved";
import Staff from "@/pages/staff";

function ScrollTop() {
  const [loc] = useLocation();
  useEffect(() => { if (!loc.startsWith("/staff/")) window.scrollTo({ top: 0 }); }, [loc]);
  return null;
}
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router hook={useHashLocation}>
          <ScrollTop />
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/survey" component={SurveyPage} />
            <Route path="/diaspora" component={Diaspora} />
            <Route path="/methods" component={Methods} />
            <Route path="/privacy" component={Privacy} />
            <Route path="/involved" component={Involved} />
            <Route path="/dashboard" component={Staff} />
            <Route path="/staff" component={Staff} />
            <Route path="/staff/:page" component={Staff} />
            <Route component={Home} />
          </Switch>
        </Router>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
