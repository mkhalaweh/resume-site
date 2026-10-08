import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

// Simple in-memory rate limiter for POST (F-03)
// Map: ip -> { count, windowStart }
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= MAX_REQUESTS) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  // Honeypot check (F-03): bots fill hidden fields, humans don't
  const body = await req.json();
  const { name, email, message, website } = body;
  if (website) {
    // Silent 200 — don't tell bots they were blocked
    return NextResponse.json({ ok: true });
  }

  // IP-based rate limit (F-03)
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

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
