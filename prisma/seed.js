// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Seed Initial Users
  const users = [
    {
      name: "Responsable GRH",
      username: "grh",
      passwordHash: "grh123",
      role: "GRH",
      status: "ACTIVE",
    },
    {
      name: "Directeur Général",
      username: "manager",
      passwordHash: "manager123",
      role: "MANAGER",
      status: "ACTIVE",
    },
    {
      name: "Ali Ben Salem",
      username: "admin",
      passwordHash: "admin123",
      role: "ADMIN",
      status: "ACTIVE",
    },
    {
      name: "Sami Trabelsi",
      username: "supervisor",
      passwordHash: "supervisor123",
      role: "SUPERVISOR",
      status: "ACTIVE",
    },
    {
      name: "Ahmed Mansour",
      username: "ahmed",
      passwordHash: "ahmed123",
      role: "OPERATOR",
      status: "ACTIVE",
    },
    {
      name: "Mohamed Dridi",
      username: "mohamed",
      passwordHash: "mohamed123",
      role: "OPERATOR",
      status: "ACTIVE",
    },
    {
      name: "Yassine Ayari",
      username: "pilot",
      passwordHash: "pilot123",
      role: "OPERATOR_PILOT",
      status: "ACTIVE",
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        name: u.name,
        passwordHash: u.passwordHash,
        role: u.role,
        status: u.status,
      },
      create: u,
    });
  }
  console.log("Users seeded successfully.");

  // 2. Seed Initial Working Place Codes
  const codes = ["RR", "FR", "CAR", "RVR", "CZ", "RES PARK", "OFF"];
  for (const c of codes) {
    await prisma.workingPlaceCode.upsert({
      where: { code: c },
      update: { isActive: true },
      create: { code: c, isActive: true },
    });
  }
  console.log("Working place codes seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
