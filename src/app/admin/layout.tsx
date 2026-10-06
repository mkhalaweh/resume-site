export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/auth";
import AdminNav from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div style={{ background: "#0e1620", minHeight: "100vh", color: "#DDE6EC" }}>
      <AdminNav />
      {children}
    </div>
  );
}
