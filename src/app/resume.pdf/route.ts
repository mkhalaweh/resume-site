import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "public");
  const filePath = path.join(dataDir, "resume.pdf");

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Mohamad_Halaweh_Resume.pdf"',
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return new NextResponse("Resume PDF not found — upload one from the admin dashboard.", { status: 404 });
  }
}
