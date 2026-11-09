import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { queryClient, session } from "./queryClient";

export type Role = "admin" | "lending" | "program" | "finance" | "leadership" | "funder";
export interface GlobalFilters {
  year?: string;
  month?: string;
  program?: string;
  county?: string;
  fund?: string;
  risk?: string;
  participantCategory?: string;
}

interface State {
  role: Role;
  setRole: (r: Role) => void;
  user: string;
  setUser: (u: string) => void;
  demo: boolean;
  setDemo: (d: boolean) => void;
  filters: GlobalFilters;
  setFilters: (f: GlobalFilters) => void;
  dark: boolean;
  setDark: (d: boolean) => void;
}

const Ctx = createContext<State | null>(null);

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrator / data steward",
  lending: "Lending staff",
  program: "Program staff",
  finance: "Finance",
  leadership: "Leadership",
  funder: "Board / funder viewer",
};
export const ROLE_USER: Record<Role, string> = {
  admin: "Data steward",
  lending: "Lending staff",
  program: "Program staff",
  finance: "Finance reviewer",
  leadership: "Leadership",
  funder: "Funder viewer",
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [role, setRoleS] = useState<Role>("leadership");
  const [user, setUserS] = useState<string>(ROLE_USER.leadership);
  const [demo, setDemoS] = useState(false);
  const [filters, setFilters] = useState<GlobalFilters>({});
  const [dark, setDark] = useState<boolean>(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const value = useMemo<State>(
    () => ({
      role,
      user,
      demo,
      filters,
      dark,
      setDark,
      setFilters,
      setRole: (r) => {
        session.role = r;
        session.user = ROLE_USER[r];
        setRoleS(r);
        setUserS(ROLE_USER[r]);
        queryClient.clear();
      },
      setUser: (u) => {
        session.user = u;
        setUserS(u);
      },
      setDemo: (d) => {
        session.demo = false;
        setDemoS(false);
        queryClient.clear();
      },
    }),
    [role, user, demo, filters, dark],
  );
  session.role = role;
  session.user = user;
  session.demo = demo;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("AppStateProvider missing");
  return c;
}

export const DOMAIN_READ: Record<string, Role[]> = {
  impact: ["admin", "program", "leadership"],
  lending: ["admin", "lending", "leadership"],
  crp: ["admin", "program", "leadership"],
  crsp: ["admin", "program", "leadership"],
  engagement: ["admin", "program", "leadership"],
  fundraising: ["admin", "finance", "leadership"],
  finance: ["admin", "finance", "leadership"],
  surveys: ["admin", "program", "leadership"],
  governance: ["admin", "program", "lending", "finance", "leadership"],
};
export const DOMAIN_WRITE: Record<string, Role[]> = {
  impact: ["admin", "program"],
  lending: ["admin", "lending"],
  crp: ["admin", "program"],
  crsp: ["admin", "program"],
  engagement: ["admin", "program"],
  fundraising: ["admin", "finance"],
  finance: ["admin", "finance"],
  surveys: ["admin", "program"],
  governance: ["admin"],
};
