/**
 * CLI to create/update an AdminUser. No public signup route exists on
 * purpose - admins are provisioned out-of-band by whoever runs this.
 *
 * Usage: npm run admin:create -- --email=a@a.com --password=secret [--role=admin]
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg?.slice(prefix.length);
}

async function main() {
  const email = argValue("email")?.trim().toLowerCase();
  const password = argValue("password");
  const role = argValue("role") || "admin";

  if (!email || !password) {
    console.error("Usage: npm run admin:create -- --email=a@a.com --password=secret [--role=admin]");
    process.exitCode = 1;
    return;
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, role },
    create: { email, passwordHash, role },
  });

  console.log(`Admin ready: ${admin.email} (role: ${admin.role})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
