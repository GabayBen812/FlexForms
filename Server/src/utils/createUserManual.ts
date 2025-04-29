import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function seedUser() {
  const hashedPassword = await bcrypt.hash("test1234", 10);

  await prisma.user.upsert({
    where: { email: "admin@flex.com" },
    update: {},
    create: {
      email: "admin@flex.com",
      password: hashedPassword,
    },
  });

  console.log("✅ User created with email: admin@flex.com | password: test1234");
  await prisma.$disconnect();
}

seedUser();
