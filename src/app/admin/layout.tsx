export const dynamic = "force-dynamic";

import Link from "next/link";
import LogoutButton from "./LogoutButton";
import AdminNav from "./AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#0e1620", minHeight: "100vh", color: "#DDE6EC" }}>
      <AdminNav />
      {children}
    </div>
  );
}
