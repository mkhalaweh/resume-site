import { getResume } from "@/app/lib/resume";
import { getPublishedArticles } from "@/app/lib/articles";
import TerminalShell from "./TerminalShell";
import type { ResumeForTerminal, ArticleForTerminal } from "./Terminal";

export default async function TerminalLoader() {
  try {
    const [resume, articles] = await Promise.all([getResume(), getPublishedArticles()]);
    if (!resume) return null;

    const resumeForTerminal: ResumeForTerminal = {
      name: resume.name,
      title: resume.title,
      location: resume.location,
      about: resume.about,
      email: resume.email,
      phone: resume.phone,
      skills: resume.skills,
      experience: resume.experience,
      certs: resume.certs,
      education: resume.education,
      linkedin: resume.linkedin,
      github: resume.github,
    };

    const articlesForTerminal: ArticleForTerminal[] = articles.map(a => ({
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt || "",
      createdAt: a.createdAt,
      tags: a.tags || "[]",
    }));

    return <TerminalShell resume={resumeForTerminal} articles={articlesForTerminal} />;
  } catch {
    return null;
  }
}
