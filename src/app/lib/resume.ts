import { prisma } from "@/app/lib/db";

export type SkillGroup = { category: string; items: string[] };
export type ExperienceItem = {
  role: string; org: string; location: string; period: string; bullets: string[];
};
export type Cert = { code: string; name: string; issuer: string };
export type Education = { degree: string; school: string };

export async function getResume() {
  const r = await prisma.resume.findFirst();
  if (!r) return null;
  return {
    ...r,
    skills: JSON.parse(r.skills) as SkillGroup[],
    experience: JSON.parse(r.experience) as ExperienceItem[],
    certs: JSON.parse(r.certs) as Cert[],
    education: JSON.parse(r.education) as Education[],
  };
}