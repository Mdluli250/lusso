import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const products = [
  // ─── CITRUS ÉLAN (Kitchen & Guest Bathroom) ──────────────────────
  {
    name: 'Citrus Élan',
    slug: 'citrus-elan',
    description:
      'Step into a space that feels instantly refreshed, vibrant, and alive. Citrus Élan opens with a sparkling burst of lime zest and crushed lemongrass, awakening the air with a crisp, clean energy. As it settles, fresh ginger root adds a subtle warmth, while a soft base of citrus peel and light musk lingers — leaving your home smelling effortlessly refined.',
    price: 28000, // R280.00
    burnTimeHours: 45,
    waxType: 'soy',
    scentProfile: 'citrus',
    variants: [
      {
        scent: 'citrus',
        waxType: 'soy',
        colorHex: '#C8E600',
        modelPath: '/models/candle-compressed.glb',
        stock: 20,
      },
    ],
  },
  // ─── PEAR & CINNAMON (Kitchen & Dining Room) ─────────────────────
  {
    name: 'Pear & Cinnamon',
    slug: 'pear-and-cinnamon',
    description:
      'Imagine the comforting aroma of a home filled with warmth, conversation, and indulgence. Juicy pear opens this scent with a soft sweetness, wrapped in the richness of warm cinnamon spice, and grounded by a delicate base of sheer musk. Pear & Cinnamon turns your space into an experience — where guests linger longer, conversations flow easier, and every moment feels intentional.',
    price: 28000, // R280.00
    burnTimeHours: 45,
    waxType: 'soy',
    scentProfile: 'cinnamon',
    variants: [
      {
        scent: 'cinnamon',
        waxType: 'soy',
        colorHex: '#D4763A',
        modelPath: '/models/cinnamon-soy.glb',
        stock: 18,
      },
    ],
  },
  // ─── POIRE LUMIÈRE (Dining Room) ──────────────────────────────────
  {
    name: 'Poire Lumière',
    slug: 'poire-lumiere',
    description:
      'Light, elegant, and effortlessly refined. Poire Lumière opens with juicy pear, lifted by the crisp brightness of green apple skin, and softened with a smooth base of sheer musk. This scent doesn\'t overpower — it elevates. It creates a clean, sophisticated atmosphere where everything feels curated and intentional.',
    price: 28000, // R280.00
    burnTimeHours: 45,
    waxType: 'soy',
    scentProfile: 'citrus',
    variants: [
      {
        scent: 'pear',
        waxType: 'soy',
        colorHex: '#A8C256',
        modelPath: '/models/candle-compressed.glb',
        stock: 15,
      },
    ],
  },
  // ─── PEONY ROSE (Bedroom) ────────────────────────────────────────
  {
    name: 'Peony Rose',
    slug: 'peony-rose',
    description:
      'Soft petals, warm textures, and a sense of calm luxury. Peony Rose blooms with delicate peony, unfolds into velvet rose petals, and melts into a comforting base of warm cashmere and soft musk. This is more than a scent — it\'s a mood. A gentle escape that transforms your bedroom into a sanctuary of softness, intimacy, and quiet indulgence.',
    price: 28000, // R280.00
    burnTimeHours: 45,
    waxType: 'soy',
    scentProfile: 'rose',
    variants: [
      {
        scent: 'rose',
        waxType: 'soy',
        colorHex: '#F4A7B9',
        modelPath: '/models/lavender-soy.glb',
        stock: 16,
      },
    ],
  },
  // ─── ROSE CASHMERE (Bedroom) ─────────────────────────────────────
  {
    name: 'Rose Cashmere',
    slug: 'rose-cashmere',
    description:
      'Deeper, richer, and more indulgent. Rose Cashmere layers blooming peony and velvet rose petals over a luxurious base of warm cashmere and soft musk, creating a scent that feels like silk against the skin. It wraps your space in warmth — intimate, elegant, and quietly powerful.',
    price: 28000, // R280.00
    burnTimeHours: 45,
    waxType: 'soy',
    scentProfile: 'rose',
    variants: [
      {
        scent: 'rose',
        waxType: 'soy',
        colorHex: '#C2185B',
        modelPath: '/models/lavender-beeswax.glb',
        stock: 12,
      },
    ],
  },
  // ─── CINNAMON VANILLA (Living Room) ──────────────────────────────
  {
    name: 'Cinnamon Vanilla',
    slug: 'cinnamon-vanilla',
    description:
      'The heart of a warm home. Cinnamon Vanilla opens with rich cinnamon spice, melts into sweet vanilla bean, and settles into a glowing base of golden amber. This scent fills your space with comfort — the kind that makes people sink into your couch, exhale, and stay a little longer.',
    price: 28000, // R280.00
    burnTimeHours: 45,
    waxType: 'soy',
    scentProfile: 'cinnamon',
    variants: [
      {
        scent: 'cinnamon',
        waxType: 'soy',
        colorHex: '#8B4513',
        modelPath: '/models/cinnamon-ember-soy.glb',
        stock: 22,
      },
    ],
  },
  // ─── GIFT SETS ───────────────────────────────────────────────────
  {
    name: 'Duo Gift Set',
    slug: 'duo-gift-set',
    description:
      'A curated pairing of two 220g Lusso candles designed to complement different spaces or moods. The perfect gift for someone who appreciates quiet luxury and intentional living.',
    price: 54000, // R540.00
    burnTimeHours: 90,
    waxType: 'soy',
    scentProfile: 'vanilla',
    variants: [
      {
        scent: 'mixed',
        waxType: 'soy',
        colorHex: '#D4AF37',
        modelPath: '/models/candle-compressed.glb',
        stock: 10,
      },
    ],
  },
  {
    name: 'Discovery Trio',
    slug: 'discovery-trio',
    description:
      'An invitation to explore — three 120g candles perfect for discovering your signature Lusso scent. A refined introduction to our collection.',
    price: 39000, // R390.00
    burnTimeHours: 75,
    waxType: 'soy',
    scentProfile: 'vanilla',
    variants: [
      {
        scent: 'mixed',
        waxType: 'soy',
        colorHex: '#E8D5B7',
        modelPath: '/models/candle-compressed.glb',
        stock: 14,
      },
    ],
  },
  {
    name: 'Signature Scent Collection',
    slug: 'signature-scent-collection',
    description:
      'A refined selection of Lusso\'s most loved fragrances in one luxurious set. Four mini tubs showcasing our signature scents — the ultimate way to experience the full Lusso range.',
    price: 52000, // R520.00
    burnTimeHours: 60,
    waxType: 'soy',
    scentProfile: 'vanilla',
    variants: [
      {
        scent: 'mixed',
        waxType: 'soy',
        colorHex: '#F5E6D3',
        modelPath: '/models/candle-compressed.glb',
        stock: 8,
      },
    ],
  },
];

async function main() {
  console.log('🕯️  Seeding Lusso candle collection...');

  for (const product of products) {
    const { variants, ...productData } = product;

    // Delete existing variants first to avoid duplicates on re-run
    const existing = await prisma.product.findUnique({
      where: { slug: productData.slug },
      select: { id: true },
    });

    if (existing) {
      await prisma.productVariant.deleteMany({
        where: { productId: existing.id },
      });
    }

    // Upsert the product, then create its variants
    const upserted = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {
        ...productData,
      },
      create: {
        ...productData,
      },
    });

    for (const variant of variants) {
      await prisma.productVariant.create({
        data: {
          ...variant,
          productId: upserted.id,
        },
      });
    }

    console.log(`  ✓ ${upserted.name} (${upserted.slug})`);
  }

  console.log(`\n✅ Seeded ${products.length} products successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
