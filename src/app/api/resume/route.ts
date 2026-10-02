import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

export async function GET() {
  const resume = await prisma.resume.findFirst();
  if (!resume) return NextResponse.json(null);
  return NextResponse.json({
    ...resume,
    skills: JSON.parse(resume.skills),
    experience: JSON.parse(resume.experience),
    certs: JSON.parse(resume.certs),
    education: JSON.parse(resume.education),
  });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const existing = await prisma.resume.findFirst();
  const data = {
    name: body.name,
    title: body.title,
    location: body.location,
    about: body.about,
    email: body.email || null,
    phone: body.phone || null,
    linkedin: body.linkedin || null,
    github: body.github || null,
    skills: JSON.stringify(body.skills),
    experience: JSON.stringify(body.experience),
    certs: JSON.stringify(body.certs),
    education: JSON.stringify(body.education),
  };

  if (existing) {
    await prisma.resume.update({ where: { id: existing.id }, data });
  } else {
    await prisma.resume.create({ data });
  }
  return NextResponse.json({ ok: true });
}
