"use client";
import { useRouter } from "next/navigation";

export default function DeleteArticleButton({ id }: { id: string }) {
  const router = useRouter();
  const handleDelete = async () => {
    if (!confirm("Delete this article?")) return;
    await fetch(`/api/articles/${id}`, { method: "DELETE" });
    router.refresh();
  };
  return (
    <button onClick={handleDelete}
      style={{ background: "none", color: "#D98872", border: "1px solid #D98872", borderRadius: 4, padding: "6px 10px", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, cursor: "pointer" }}>
      delete
    </button>
  );
}
