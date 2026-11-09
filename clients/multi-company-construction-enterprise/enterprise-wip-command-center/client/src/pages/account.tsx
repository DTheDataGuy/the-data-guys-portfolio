import { PageHeader, Panel } from "@/components/kit";
import { PasswordForm } from "./login";
import { useSession } from "@/lib/queryClient";
export default function AccountPage() {
  const s = useSession();
  return (
    <div className="max-w-xl">
      <PageHeader title="Your account" subtitle={`${s.user?.name} · ${s.user?.roleLabel}${s.user?.email ? ` · ${s.user.email}` : ""}`} />
      <Panel title="Change password"><PasswordForm /></Panel>
    </div>
  );
}
