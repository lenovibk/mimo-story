import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";

const CODE_TTL_MS = 10 * 60 * 1000;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueVerificationCode(email: string): Promise<string> {
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  await prisma.verificationCode.create({
    data: { email, codeHash, expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });
  return code;
}

export async function consumeVerificationCode(email: string, code: string): Promise<boolean> {
  const candidates = await prisma.verificationCode.findMany({
    where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  for (const candidate of candidates) {
    if (await bcrypt.compare(code, candidate.codeHash)) {
      await prisma.verificationCode.update({
        where: { id: candidate.id },
        data: { consumedAt: new Date() },
      });
      return true;
    }
  }

  return false;
}
