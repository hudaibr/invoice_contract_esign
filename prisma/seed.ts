import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt-ts";

const db = new PrismaClient();

async function main() {
  const email = "admin@jiggersinjoggers.com";
  const password = "admin123";

  const hashedPassword = await hash(password, 10);

  await db.user.upsert({
    where: { email },
    update: {},
    create: { email, hashedPassword },
  });

  console.log(`Seeded admin user: ${email} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
