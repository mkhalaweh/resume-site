import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
console.log("Resumes:", await p.resume.count());
console.log("Articles:", await p.article.count());
console.log("Users:", await p.user.count());
const r = await p.resume.findFirst();
console.log("Resume name:", r?.name);
await p.$disconnect();