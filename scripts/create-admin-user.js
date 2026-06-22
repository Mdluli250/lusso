const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  try {
    const user = await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: { role: "ADMIN", name: "Admin" },
      create: { email: "admin@example.com", name: "Admin", role: "ADMIN" },
    });
    console.log(
      JSON.stringify({ id: user.id, email: user.email, role: user.role }),
    );
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
