/**
 * CMS Content Registry
 *
 * Defines all 48 managed content blocks for the Lusso CMS.
 * Imported by:
 *   - prisma/seed.ts  (to seed initial values)
 *   - src/app/admin/content/page.tsx  (to render the admin content panel)
 *
 * Requirements: 1.4, 8.1, 8.3
 */

import { ContentType } from "@prisma/client";
import {
  TESTIMONIALS,
  SERVICES,
  GALLERY_IMAGES,
  BUSINESS_INFO,
} from "@/lib/constants/brand";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContentRegistryEntry {
  key: string;
  type: ContentType;
  value: string;
  label: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Section labels
// ---------------------------------------------------------------------------

/** Maps a section key prefix to a human-readable section label. */
export const SECTION_LABELS: Record<string, string> = {
  hero: "Hero Section",
  about_preview: "About Preview",
  about_page: "About Page",
  testimonials: "Testimonials",
  services: "Services",
  gallery_images: "Gallery Images",
  business_info: "Business Info",
  experiences: "Experiences",
  footer: "Footer",
  why_lusso: "Why Lusso",
};

// ---------------------------------------------------------------------------
// Why Lusso items — sourced from Services.tsx hardcoded array
// ---------------------------------------------------------------------------

const WHY_LUSSO_ITEMS: string[] = [
  "Hand-poured in small batches",
  "Premium soy & beeswax blends",
  "Long-lasting fragrance throw",
  "Elegant reusable vessels",
  "Thoughtfully curated scent collections",
  "Locally crafted in South Africa",
];

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const CONTENT_REGISTRY: ContentRegistryEntry[] = [
  // ─── Hero Section ──────────────────────────────────────────────────────────
  {
    key: "hero.heading",
    type: ContentType.text,
    value: "Quiet Luxury Candles",
    label: "Hero heading",
    description: "Main h1 displayed on the hero banner.",
  },
  {
    key: "hero.subtext",
    type: ContentType.text,
    value:
      "Born from Lusso Picnic, we craft hand-poured candles with premium waxes and fine fragrances — quiet luxury for your everyday moments.",
    label: "Hero subtext",
    description: "Subtitle paragraph beneath the hero heading.",
  },
  {
    key: "hero.cta_label",
    type: ContentType.text,
    value: "Shop now",
    label: "CTA button label",
    description: "Text on the hero call-to-action button.",
  },
  {
    key: "hero.bg_image",
    type: ContentType.image,
    value: "/images/gallery/styled-trio-1.png",
    label: "Hero background image",
    description: "Full-viewport background image for the hero section.",
  },

  // ─── About Preview ─────────────────────────────────────────────────────────
  {
    key: "about_preview.heading",
    type: ContentType.text,
    value: "About Lusso Candles",
    label: "Preview heading",
    description: "Heading for the About preview block on the home page.",
  },
  {
    key: "about_preview.body_1",
    type: ContentType.rich_text,
    value:
      "Born from a love of atmosphere and intention, Lusso Candles are hand-poured in small batches using premium soy and beeswax blends. Every candle is crafted with sustainably sourced botanicals and phthalate-free fragrance oils, honouring both the senses and the earth.",
    label: "Preview body 1",
    description: "First paragraph of the About preview on the home page.",
  },
  {
    key: "about_preview.body_2",
    type: ContentType.rich_text,
    value:
      "We believe quiet luxury lives in the details — the slow pour, the natural wick, the vessel designed to be kept long after the last flame.",
    label: "Preview body 2",
    description: "Second paragraph of the About preview on the home page.",
  },
  {
    key: "about_preview.cta_label",
    type: ContentType.text,
    value: "Learn More",
    label: "Preview CTA label",
    description: "Text on the About preview call-to-action button.",
  },

  // ─── About Page ────────────────────────────────────────────────────────────
  {
    key: "about_page.heading",
    type: ContentType.text,
    value: "Our Story",
    label: "About page heading",
    description: "Main h1 on the /about page.",
  },
  {
    key: "about_page.intro",
    type: ContentType.rich_text,
    value:
      "From curated picnics to hand-poured candles — a journey rooted in atmosphere, intention, and quiet luxury.",
    label: "About page intro",
    description: "Introductory paragraph below the About page heading.",
  },
  {
    key: "about_page.story_heading",
    type: ContentType.text,
    value: "About Lusso Candles",
    label: "Story section heading",
    description: "Heading for the brand story section on /about.",
  },
  {
    key: "about_page.story_body_1",
    type: ContentType.rich_text,
    value:
      "Born from the experiences created through Lusso Picnics, Lusso Candles extends our passion for beautiful spaces into the home.",
    label: "Story body 1",
    description: "First paragraph of the brand story on /about.",
  },
  {
    key: "about_page.story_body_2",
    type: ContentType.rich_text,
    value:
      "We believe luxury is not about excess—it is about creating intentional moments that bring comfort, calm, and connection. Each candle is hand-poured in small batches using premium soy and beeswax blends and carefully curated fragrances that evoke warmth, elegance, and lasting memories.",
    label: "Story body 2",
    description: "Second paragraph of the brand story on /about.",
  },
  {
    key: "about_page.story_body_3",
    type: ContentType.rich_text,
    value:
      "Whether you're hosting guests, unwinding after a long day, or celebrating life's special moments, Lusso Candles creates an atmosphere that feels effortlessly luxurious.",
    label: "Story body 3",
    description: "Third paragraph of the brand story on /about.",
  },
  {
    key: "about_page.story_tagline",
    type: ContentType.text,
    value: "Clean. Comfortable. Intentional.",
    label: "Story tagline",
    description: "Bold tagline at the end of the brand story section.",
  },
  {
    key: "about_page.story_image",
    type: ContentType.image,
    value: "/images/about/workshop.png",
    label: "Story image",
    description: "Image displayed alongside the brand story on /about.",
  },
  {
    key: "about_page.philosophy_heading",
    type: ContentType.text,
    value: "Our Philosophy",
    label: "Philosophy heading",
    description: "Heading for the philosophy section on /about.",
  },
  {
    key: "about_page.philosophy_body_1",
    type: ContentType.rich_text,
    value:
      "We believe luxury should be felt, not announced. Every Lusso candle is hand-poured in small batches using premium soy wax and beeswax blends, paired with phthalate-free fragrance oils sourced for depth and longevity. We choose natural cotton wicks and reusable vessels because craft without conscience isn't craft at all.",
    label: "Philosophy body 1",
    description: "First paragraph of the philosophy section on /about.",
  },
  {
    key: "about_page.philosophy_body_2",
    type: ContentType.rich_text,
    value:
      "Sustainability isn't a marketing line for us — it's a practice woven into every decision. From biodegradable packaging to locally sourced botanicals, we work to ensure that what brings warmth to your home doesn't cost the earth. Our wax is renewable, our fragrances are clean, and our vessels are designed to be repurposed long after the last burn.",
    label: "Philosophy body 2",
    description: "Second paragraph of the philosophy section on /about.",
  },
  {
    key: "about_page.philosophy_body_3",
    type: ContentType.rich_text,
    value:
      "Based in Centurion, we draw inspiration from the South African landscape — the golden light of the highveld, the earthy warmth of fynbos, the quiet stillness of a winter evening. These are the moments we bottle, one pour at a time.",
    label: "Philosophy body 3",
    description: "Third paragraph of the philosophy section on /about.",
  },
  {
    key: "about_page.philosophy_image",
    type: ContentType.image,
    value: "/images/about/materials.png",
    label: "Philosophy image",
    description: "Image displayed alongside the philosophy section on /about.",
  },

  // ─── JSON blocks ───────────────────────────────────────────────────────────
  {
    key: "testimonials",
    type: ContentType.json,
    value: JSON.stringify([...TESTIMONIALS]),
    label: "Testimonials",
    description: "Array of { quote, name } objects shown in the Testimonials section.",
  },
  {
    key: "services",
    type: ContentType.json,
    value: JSON.stringify([...SERVICES]),
    label: "Services",
    description: "Array of { name, description } objects for the Services section.",
  },
  {
    key: "gallery_images",
    type: ContentType.json,
    value: JSON.stringify(GALLERY_IMAGES),
    label: "Gallery images",
    description: "Array of { src, alt, width, height } objects for the gallery.",
  },

  // ─── Business Info ─────────────────────────────────────────────────────────
  {
    key: "business_info.address",
    type: ContentType.text,
    value: BUSINESS_INFO.address,
    label: "Address",
    description: "Physical street address displayed in the footer and contact page.",
  },
  {
    key: "business_info.hours",
    type: ContentType.text,
    value: BUSINESS_INFO.hours,
    label: "Business hours",
    description: "Trading hours displayed in the footer.",
  },
  {
    key: "business_info.phone",
    type: ContentType.text,
    value: BUSINESS_INFO.phone,
    label: "Phone",
    description: "Display-formatted phone number.",
  },
  {
    key: "business_info.phone_href",
    type: ContentType.text,
    value: BUSINESS_INFO.phoneHref,
    label: "Phone href",
    description: "tel: URI used as the href of the phone anchor tag.",
  },
  {
    key: "business_info.email",
    type: ContentType.text,
    value: BUSINESS_INFO.email,
    label: "Email address",
    description: "Display email address.",
  },
  {
    key: "business_info.email_href",
    type: ContentType.text,
    value: BUSINESS_INFO.emailHref,
    label: "Email href",
    description: "mailto: URI used as the href of the email anchor tag.",
  },
  {
    key: "business_info.map_embed_url",
    type: ContentType.text,
    value: BUSINESS_INFO.mapEmbedUrl,
    label: "Map embed URL",
    description: "Google Maps embed URL used in the contact page iframe.",
  },

  // ─── Experiences ───────────────────────────────────────────────────────────
  {
    key: "experiences.intro_1",
    type: ContentType.rich_text,
    value:
      "Born from the experiences created through Lusso Picnics, Lusso Candles extends our passion for beautiful spaces into the home.",
    label: "Experiences intro 1",
    description: "First paragraph of the intro on the /experiences page.",
  },
  {
    key: "experiences.intro_2",
    type: ContentType.rich_text,
    value:
      "We believe luxury is not about excess—it is about creating intentional moments that bring comfort, calm, and connection. Each candle is hand-poured in small batches using premium soy and beeswax blends and carefully curated fragrances that evoke warmth, elegance, and lasting memories.",
    label: "Experiences intro 2",
    description: "Second paragraph of the intro on the /experiences page.",
  },
  {
    key: "experiences.intro_3",
    type: ContentType.rich_text,
    value:
      "Whether you're hosting guests, unwinding after a long day, or celebrating life's special moments, Lusso Candles creates an atmosphere that feels effortlessly luxurious.",
    label: "Experiences intro 3",
    description: "Third paragraph of the intro on the /experiences page.",
  },
  {
    key: "experiences.intro_tagline",
    type: ContentType.text,
    value: "Clean. Comfortable. Intentional.",
    label: "Experiences tagline",
    description: "Bold tagline at the end of the experiences intro.",
  },
  {
    key: "experiences.picnics_heading",
    type: ContentType.text,
    value: "Lusso Picnics",
    label: "Picnics heading",
    description: "Heading for the Lusso Picnics section on /experiences.",
  },
  {
    key: "experiences.picnics_body_1",
    type: ContentType.rich_text,
    value:
      "Our curated outdoor experiences bring together intimate gatherings, thoughtful styling, and the warm glow of hand-poured candles. Each Lusso Picnic is designed as a sensory escape — from the soft flicker of candlelight to carefully chosen scents that complement the setting and season. Whether it's a birthday celebration, an anniversary, or simply an afternoon with friends, we create the atmosphere so you can be fully present in the moment.",
    label: "Picnics body 1",
    description: "First paragraph of the Lusso Picnics section on /experiences.",
  },
  {
    key: "experiences.picnics_body_2",
    type: ContentType.rich_text,
    value:
      "Every detail is considered: linen draping, botanical arrangements, curated playlists, and of course, our signature candle installations that transform any outdoor space into something extraordinary. Based in Centurion, we bring the quiet luxury of a Lusso experience to parks, gardens, and private estates across Gauteng.",
    label: "Picnics body 2",
    description: "Second paragraph of the Lusso Picnics section on /experiences.",
  },
  {
    key: "experiences.picnics_image",
    type: ContentType.image,
    value: "/images/experiences/picnic.jpg",
    label: "Picnics image",
    description: "Image displayed alongside the Lusso Picnics section.",
  },
  {
    key: "experiences.scent_heading",
    type: ContentType.text,
    value: "Scent-Styling Services",
    label: "Scent-styling heading",
    description: "Heading for the Scent-Styling Services section on /experiences.",
  },
  {
    key: "experiences.scent_body_1",
    type: ContentType.rich_text,
    value:
      "Fragrance has the power to define a space and anchor a memory. Our bespoke scent-styling service pairs you with a dedicated fragrance consultant who crafts a custom scent narrative for your event — whether it's a wedding, a product launch, or a corporate gathering. We work with you to select notes that reflect your vision, from fresh botanicals to warm amber and oud.",
    label: "Scent body 1",
    description: "First paragraph of the Scent-Styling section on /experiences.",
  },
  {
    key: "experiences.scent_body_2",
    type: ContentType.rich_text,
    value:
      "The result is a cohesive olfactory experience woven throughout your venue: welcome candles at the entrance, signature blends at each table, and take-home favours your guests will treasure. Every element is hand-poured in our Centurion studio using premium soy wax and phthalate-free oils, ensuring a clean burn and lasting impression.",
    label: "Scent body 2",
    description: "Second paragraph of the Scent-Styling section on /experiences.",
  },
  {
    key: "experiences.scent_image",
    type: ContentType.image,
    value: "/images/experiences/scent-styling.png",
    label: "Scent-styling image",
    description: "Image displayed alongside the Scent-Styling section.",
  },

  // ─── Footer ────────────────────────────────────────────────────────────────
  {
    key: "footer.sustainability_text",
    type: ContentType.rich_text,
    value:
      "Crafted with sustainably sourced materials. We are committed to eco-conscious practices in every pour.",
    label: "Footer sustainability",
    description: "Short sustainability statement shown in the footer brand column.",
  },
  {
    key: "footer.newsletter_heading",
    type: ContentType.text,
    value: "Join Our Inner Circle",
    label: "Newsletter heading",
    description: "Heading above the newsletter sign-up form in the footer.",
  },
  {
    key: "footer.newsletter_subtext",
    type: ContentType.text,
    value: "Early access to new scents, exclusive offers, and candle care tips.",
    label: "Newsletter subtext",
    description: "Subtext below the newsletter heading in the footer.",
  },

  // ─── Why Lusso ─────────────────────────────────────────────────────────────
  {
    key: "why_lusso.heading",
    type: ContentType.text,
    value: "Why Choose Lusso?",
    label: "Why Lusso heading",
    description: "Heading for the Why Choose Lusso section on the home page.",
  },
  {
    key: "why_lusso.items",
    type: ContentType.json,
    value: JSON.stringify(WHY_LUSSO_ITEMS),
    label: "Why Lusso items",
    description: "Array of plain strings listing the reasons to choose Lusso.",
  },
];
