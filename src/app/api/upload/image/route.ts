import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Must be an image (jpg, png, gif, webp, svg)" }, { status: 400 });
  }

  const rawExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const ext = rawExt.replace(/[^a-z0-9]/g, "") || "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "public");
  const uploadsDir = path.join(dataDir, "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const dest = path.join(uploadsDir, filename);

  const bytes = await file.arrayBuffer();
  await writeFile(dest, Buffer.from(bytes));

  return NextResponse.json({ url: `/uploads/${filename}` });
}
