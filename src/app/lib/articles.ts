import { prisma } from "@/app/lib/db";

export async function getPublishedArticles(tag?: string) {
  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, title: true, excerpt: true, createdAt: true, content: true, tags: true },
  });
  if (!tag) return articles;
  return articles.filter(a => {
    const tags: string[] = JSON.parse(a.tags || "[]");
    return tags.includes(tag);
  });
}

export async function getAllTags(): Promise<string[]> {
  const articles = await prisma.article.findMany({
    where: { published: true },
    select: { tags: true },
  });
  const tagSet = new Set<string>();
  for (const a of articles) {
    const tags: string[] = JSON.parse(a.tags || "[]");
    tags.forEach(t => tagSet.add(t));
  }
  return Array.from(tagSet).sort();
}

export async function getArticleBySlug(slug: string) {
  return prisma.article.findUnique({ where: { slug } });
}

export async function getRelatedArticles(currentSlug: string, tags: string[], limit = 3) {
  if (tags.length === 0) return [];
  const articles = await prisma.article.findMany({
    where: { published: true, slug: { not: currentSlug } },
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, title: true, excerpt: true, createdAt: true, tags: true },
  });
  return articles
    .map(a => {
      const aTags: string[] = JSON.parse(a.tags || "[]");
      return { ...a, overlap: aTags.filter(t => tags.includes(t)).length };
    })
    .filter(a => a.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit);
}

export async function getAllArticles() {
  return prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, title: true, excerpt: true, published: true, createdAt: true, updatedAt: true, tags: true },
  });
}
