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
      skills: JSON.parse(resume.skills || "[]"),
      experience: JSON.parse(resume.experience || "[]"),
      certs: JSON.parse(resume.certs || "[]"),
      education: JSON.parse(resume.education || "[]"),
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
