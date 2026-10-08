import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, message, website } = body;

  // Honeypot — bots fill hidden fields, humans don't
  if (website) return NextResponse.json({ ok: true });

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }
  if (message.trim().length < 10) {
    return NextResponse.json({ error: "Message is too short." }, { status: 400 });
  }

  await prisma.contactMessage.create({
    data: { name: name.trim(), email: email.trim(), message: message.trim() },
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";
  const messages = await prisma.contactMessage.findMany({
    where: unreadOnly ? { read: false } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(messages);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, read } = await req.json();
  if (!id || typeof read !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const msg = await prisma.contactMessage.update({ where: { id }, data: { read } });
  return NextResponse.json(msg);
}
