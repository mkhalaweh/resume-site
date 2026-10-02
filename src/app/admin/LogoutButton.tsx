"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };
  return (
    <button onClick={handleLogout} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6E7B84", background: "none", border: "none", cursor: "pointer" }}>
      logout
    </button>
  );
}
