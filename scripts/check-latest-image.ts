import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const p = await prisma.product.findFirst({ orderBy: { createdAt: "desc" } });
  console.log(
    JSON.stringify({ id: p?.id, slug: p?.slug, image: p?.image }, null, 2),
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
