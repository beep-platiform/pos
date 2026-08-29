import { redirect } from "next/navigation";
import { getSessionContext, ROLE_NAV } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSessionContext();

  if (!ctx) {
    redirect("/onboarding");
  }

  const allowedKeys = ROLE_NAV[ctx.role] ?? [];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        allowedKeys={allowedKeys}
        businessName={ctx.businessName}
        fullName={ctx.fullName}
        role={ctx.role}
      />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
