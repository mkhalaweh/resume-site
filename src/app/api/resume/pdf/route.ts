import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("pdf") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.type !== "application/pdf") return NextResponse.json({ error: "Must be a PDF" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "public");
  const dest = path.join(dataDir, "resume.pdf");
  await writeFile(dest, buffer);

  return NextResponse.json({ ok: true, path: "/resume.pdf" });
}
