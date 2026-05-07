import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Mood = 'relaxing' | 'energizing' | 'romantic' | 'grounding';
type TimeOfDay = 'morning' | 'afternoon' | 'evening';
type Intensity = 'subtle' | 'moderate' | 'bold';

const VALID_MOODS: Mood[] = ['relaxing', 'energizing', 'romantic', 'grounding'];
const VALID_TIMES: TimeOfDay[] = ['morning', 'afternoon', 'evening'];
const VALID_INTENSITIES: Intensity[] = ['subtle', 'moderate', 'bold'];

// Maps answer combinations to scent profiles
const QUIZ_MAPPING: Record<string, string[]> = {
  'relaxing-morning-subtle': ['lavender', 'citrus'],
  'relaxing-morning-moderate': ['lavender'],
  'relaxing-morning-bold': ['lavender', 'sandalwood'],
  'relaxing-afternoon-subtle': ['lavender', 'vanilla'],
  'relaxing-afternoon-moderate': ['lavender', 'cedar'],
  'relaxing-afternoon-bold': ['sandalwood'],
  'relaxing-evening-subtle': ['lavender'],
  'relaxing-evening-moderate': ['lavender', 'sandalwood'],
  'relaxing-evening-bold': ['sandalwood'],
  'energizing-morning-subtle': ['citrus'],
  'energizing-morning-moderate': ['citrus', 'eucalyptus'],
  'energizing-morning-bold': ['eucalyptus'],
  'energizing-afternoon-subtle': ['citrus', 'vanilla'],
  'energizing-afternoon-moderate': ['citrus'],
  'energizing-afternoon-bold': ['eucalyptus', 'citrus'],
  'energizing-evening-subtle': ['citrus'],
  'energizing-evening-moderate': ['eucalyptus'],
  'energizing-evening-bold': ['eucalyptus', 'cinnamon'],
  'romantic-morning-subtle': ['rose', 'vanilla'],
  'romantic-morning-moderate': ['rose'],
  'romantic-morning-bold': ['rose', 'cinnamon'],
  'romantic-afternoon-subtle': ['vanilla', 'rose'],
  'romantic-afternoon-moderate': ['rose', 'sandalwood'],
  'romantic-afternoon-bold': ['cinnamon'],
  'romantic-evening-subtle': ['rose', 'vanilla'],
  'romantic-evening-moderate': ['rose'],
  'romantic-evening-bold': ['cinnamon'],
  'grounding-morning-subtle': ['cedar', 'vanilla'],
  'grounding-morning-moderate': ['cedar'],
  'grounding-morning-bold': ['cedar', 'sandalwood'],
  'grounding-afternoon-subtle': ['cedar', 'vanilla'],
  'grounding-afternoon-moderate': ['cedar', 'sandalwood'],
  'grounding-afternoon-bold': ['sandalwood', 'cinnamon'],
  'grounding-evening-subtle': ['sandalwood', 'vanilla'],
  'grounding-evening-moderate': ['sandalwood'],
  'grounding-evening-bold': ['sandalwood', 'cinnamon'],
};

const DEFAULT_SCENTS: Record<Mood, string[]> = {
  relaxing: ['lavender', 'sandalwood'],
  energizing: ['citrus', 'eucalyptus'],
  romantic: ['rose', 'vanilla'],
  grounding: ['cedar', 'sandalwood'],
};

function getRecommendedScents(mood: Mood, time: TimeOfDay, intensity: Intensity): string[] {
  const key = `${mood}-${time}-${intensity}`;
  return QUIZ_MAPPING[key] ?? DEFAULT_SCENTS[mood];
}

/**
 * POST /api/quiz/recommend — accepts quiz answers and returns product recommendations.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mood, timeOfDay, intensity } = body;

    // Validate inputs
    if (!VALID_MOODS.includes(mood)) {
      return NextResponse.json(
        { error: 'Invalid mood value' },
        { status: 400 }
      );
    }
    if (!VALID_TIMES.includes(timeOfDay)) {
      return NextResponse.json(
        { error: 'Invalid timeOfDay value' },
        { status: 400 }
      );
    }
    if (!VALID_INTENSITIES.includes(intensity)) {
      return NextResponse.json(
        { error: 'Invalid intensity value' },
        { status: 400 }
      );
    }

    const scentProfiles = getRecommendedScents(mood, timeOfDay, intensity);

    // Query products matching the computed scent profiles
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        scentProfile: { in: scentProfiles },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        scentProfile: true,
        description: true,
        variants: {
          select: { modelPath: true },
          take: 1,
        },
      },
    });

    // Sort by relevance (order of scent profiles in the mapping)
    const sorted = products.sort((a, b) => {
      const aIndex = scentProfiles.indexOf(a.scentProfile);
      const bIndex = scentProfiles.indexOf(b.scentProfile);
      return aIndex - bIndex;
    });

    if (sorted.length === 0) {
      return NextResponse.json({
        products: [],
        message: 'No exact matches found. Browse our full collection to discover your perfect scent.',
        scentProfiles,
      });
    }

    return NextResponse.json({
      products: sorted.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        scentProfile: p.scentProfile,
        description: p.description,
        modelPath: p.variants[0]?.modelPath ?? null,
      })),
      scentProfiles,
    });
  } catch (error) {
    console.error('Quiz recommendation failed:', error);
    return NextResponse.json(
      { error: 'Failed to compute recommendations' },
      { status: 500 }
    );
  }
}
