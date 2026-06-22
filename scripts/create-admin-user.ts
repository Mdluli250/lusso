import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { role: "ADMIN", name: "Admin" },
    create: { email: "admin@example.com", name: "Admin", role: "ADMIN" },
  });
  console.log(
    JSON.stringify({ id: user.id, email: user.email, role: user.role }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
