import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ---- Admin user (just you) ----
  // Password is read from env at seed time; change it after first login flow is built.
  const adminEmail = process.env.ADMIN_EMAIL || "mohamadhalaweh@hotmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme123";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash },
  });

  // ---- Resume (single row) ----
  const skills = [
    { category: "Cloud Security", items: ["Azure security architecture", "RBAC & PIM (least privilege)", "CSPM & posture management", "SASE & WAF operations", "CDN & access controls"] },
    { category: "Detection & Response", items: ["Microsoft Sentinel", "Microsoft Defender", "SIEM / SOAR engineering", "Detection rule tuning", "Incident response"] },
    { category: "Identity & Governance", items: ["IAM design", "Tiered access models", "ISO 27001 mapping", "Risk & gap analysis", "Vulnerability management"] },
    { category: "Foundations", items: ["Networking (CCNA)", "Log retention strategy", "Security automation", "Penetration testing", "Security documentation"] },
  ];

  const experience = [
    {
      role: "Security Consulting Consultant",
      org: "Accenture",
      location: "Doha, Qatar",
      period: "May 2026 — Present",
      bullets: [
        "Lead security architecture reviews and design workshops across cloud-native controls, identity, network security, and compliance.",
        "Embed security-by-design across cloud transformation with cloud, infrastructure, networking, and application teams.",
        "Drive responsible AI adoption in security engagements while maintaining governance and human oversight.",
        "Mentor junior consultants and analysts, reviewing deliverables and building team capability.",
      ],
    },
    {
      role: "Security Consulting Analyst",
      org: "Accenture",
      location: "Doha, Qatar",
      period: "Apr 2025 — May 2026",
      bullets: [
        "Cloud Security Consultant on a large-scale government hyperscaler engagement — multi-cloud architecture, threat management, and governance.",
        "Designed a tiered IAM model with Azure RBAC and PIM, enforcing least privilege and prod / non-prod segregation.",
        "Led WAF and SASE architecture and operations for cloud applications and access controls.",
        "Defined a SIEM retention strategy that cut ingestion cost by $30K/month without losing compliance coverage.",
        "Ran CSPM and compliance initiatives, raising the cloud posture score from 50% to 90%.",
      ],
    },
    {
      role: "SIEM Engineer & Incident Responder",
      org: "Wizard Cyber",
      location: "Amman, Jordan",
      period: "Jun 2024 — Apr 2025",
      bullets: [
        "Led end-to-end onboarding — deploying Microsoft Sentinel and Defender from setup to full operation.",
        "Ran incident response: containment, remediation, and post-incident reporting.",
        "Primary point of contact for multiple clients on SIEM and SOAR engineering.",
        "Drove pre-sales through proposals, technical demos, and POCs.",
      ],
    },
    {
      role: "Security Engineer",
      org: "Wizard Cyber",
      location: "Amman, Jordan",
      period: "Feb 2023 — Jun 2024",
      bullets: [
        "Built security playbooks and automation with cloud-native orchestration.",
        "Resolved L1/L2 tickets for 30+ clients.",
        "Developed and fine-tuned detection rules to cut false positives.",
        "Mentored 8 trainees to a 100% SC-200 pass rate, promoting them into L1 SOC roles.",
      ],
    },
    {
      role: "Cybersecurity Consultant / Engineer",
      org: "Black Mountain · Alpha-Hub ICT",
      location: "Amman, Jordan",
      period: "2022",
      bullets: [
        "Mapped ISO 27001 ISMS to medical-lab standards; ran web and network penetration tests.",
        "Hands-on with QRadar, Splunk, and ThreatQ, plus adversary emulation (INE, Caldera).",
      ],
    },
  ];

  const certs = [
    { code: "AZ-500", name: "Azure Security Engineer Associate", issuer: "Microsoft" },
    { code: "SC-300", name: "Identity and Access Administrator Associate", issuer: "Microsoft" },
    { code: "SC-200", name: "Security Operations Analyst Associate", issuer: "Microsoft" },
    { code: "CCNA", name: "Cisco Certified Network Associate", issuer: "Cisco" },
  ];

  const education = [
    { degree: "BE, Networks & Information Security Engineering", school: "Princess Sumaya University for Technology" },
  ];

  // Only one resume row; clear and recreate for a clean seed.
  await prisma.resume.deleteMany();
  await prisma.resume.create({
    data: {
      name: "Mohamad Halaweh",
      title: "Cloud & Security Consultant",
      location: "Doha, Qatar",
      about:
        "Security consultant at Accenture working across cloud security architecture, identity, and detection engineering. My background runs from the SOC floor to the architecture whiteboard — building SIEM deployments from scratch, leading incident response, and advising on multi-cloud security for large government and enterprise programs.\n\nMost comfortable where security meets real infrastructure: Azure identity and governance, Microsoft Sentinel and Defender, SASE and WAF controls, and the discipline of tuning detections, cutting false positives, and keeping ingestion costs honest.",
      skills: JSON.stringify(skills),
      experience: JSON.stringify(experience),
      certs: JSON.stringify(certs),
      education: JSON.stringify(education),
      email: process.env.RESUME_EMAIL || "",
      phone: process.env.RESUME_PHONE || "",
      linkedin: "https://linkedin.com/in/mohamad-halaweh",
      github: "https://github.com/mkhalaweh",
    },
  });

  // ---- One sample article so the blog isn't empty ----
  await prisma.article.upsert({
    where: { slug: "building-a-cloud-security-home-lab" },
    update: {},
    create: {
      slug: "building-a-cloud-security-home-lab",
      title: "Building a Cloud Security Home Lab",
      excerpt:
        "How I built a defensible cloud security lab on a single VPS — Docker, a CI/CD security gate, Cloudflare Zero Trust, and a self-hosted Wazuh SIEM.",
      content:
        "<p>This is a sample article. Once the editor is wired up, you'll write real posts here — with headings, images, and code blocks.</p><p>The idea: document the security lab end to end, from VPS hardening to the SIEM.</p>",
      published: true,
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });