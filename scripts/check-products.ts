import { prisma } from '../src/lib/prisma';

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, isActive: true },
    take: 5,
  });
  console.log(JSON.stringify(products, null, 2));
}

main().finally(() => prisma.$disconnect());
