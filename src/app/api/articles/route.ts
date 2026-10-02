import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { getSession } from "@/app/lib/auth";

export async function GET() {
  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(articles);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, slug, excerpt, content, published, tags } = body;
  if (!title || !slug) return NextResponse.json({ error: "Title and slug required" }, { status: 400 });

  try {
    const article = await prisma.article.create({
      data: { title, slug, excerpt: excerpt || "", content: content || "", published: !!published, tags: JSON.stringify(Array.isArray(tags) ? tags : []) },
    });
    return NextResponse.json(article, { status: 201 });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json({ error: `Slug "${slug}" is already taken — choose a different one.` }, { status: 409 });
    }
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
