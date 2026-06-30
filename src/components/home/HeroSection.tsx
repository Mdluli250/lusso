/**
 * HeroSection — async Server Component wrapper.
 *
 * Fetches hero content from the CMS service and passes it as props to the
 * client-side HeroContent component which handles GSAP animations.
 *
 * Requirements: 2.1, 2.2, 7.3
 */

import { getContentSection } from '@/lib/cms/service';
import { HeroContent } from './HeroContent';

const heroFallbacks: Record<string, string> = {
  'hero.heading': 'Quiet Luxury Candles',
  'hero.subtext':
    'Born from Lusso Picnic, we craft hand-poured candles with premium waxes and fine fragrances — quiet luxury for your everyday moments.',
  'hero.cta_label': 'Shop now',
  'hero.bg_image': '/images/gallery/styled-trio-1.png',
};

export async function HeroSection() {
  const content = await getContentSection('hero', heroFallbacks);

  return (
    <HeroContent
      heading={content.get('hero.heading') ?? heroFallbacks['hero.heading']}
      subtext={content.get('hero.subtext') ?? heroFallbacks['hero.subtext']}
      ctaLabel={content.get('hero.cta_label') ?? heroFallbacks['hero.cta_label']}
      bgImage={content.get('hero.bg_image') ?? heroFallbacks['hero.bg_image']}
    />
  );
}
