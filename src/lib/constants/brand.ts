// Brand constants for Lusso Candles website
// Requirements: 4.2, 5.3, 6.2, 7.2, 8.1, 8.2, 8.3, 8.4, 9.2, 9.3, 9.4, 13.1

// --- Types ---

export interface GalleryImage {
  src: string;
  alt: string; // 10-150 chars
  width: number;
  height: number;
}

export interface CollectionCard {
  title: string; // max 50 chars
  description: string; // max 150 chars
  imageUrl: string;
  filterParam: string; // e.g. "waxType=soy"
}

export interface ContactFormData {
  name: string; // max 100 chars
  email: string; // max 254 chars
  topic: string;
  message: string; // max 2000 chars
}

export interface InquiryFormData {
  name: string;
  email: string;
  message: string; // max 1000 chars
}

// --- Constants ---

export const BUSINESS_INFO = {
  address:
    '1065 Spoonwood Street, Eco Park Estate, Centurion 0157, South Africa',
  hours: 'Mon-Sat: 9am-6pm',
  phone: '(012) 345-6789',
  phoneHref: 'tel:+27123456789',
  email: 'hello@lusso.co.za',
  emailHref: 'mailto:hello@lusso.co.za',
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3593.123!2d28.187!3d-25.863!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDUxJzQ3LjAiUyAyOMKwMTEnMTMuMiJF!5e0!3m2!1sen!2sza!4v1700000000000',
} as const;

export const SOCIAL_LINKS = [
  {
    platform: 'Instagram',
    url: 'https://instagram.com/lussocandles',
    icon: 'instagram',
  },
  {
    platform: 'TikTok',
    url: 'https://tiktok.com/@lussocandles',
    icon: 'tiktok',
  },
  {
    platform: 'Facebook',
    url: 'https://facebook.com/lussocandles',
    icon: 'facebook',
  },
] as const;

export const SERVICES = [
  {
    name: 'Signature Lusso Candles',
    description:
      'Hand-poured in small batches using sustainably sourced wax and fine fragrance oils, each candle is crafted to fill your space with warmth and intention.',
  },
  {
    name: 'Custom Wax Blends',
    description:
      'Work with our artisans to create a bespoke scent profile tailored to your home, event, or brand — from wax selection to wick and vessel.',
  },
  {
    name: 'Gifting Programs',
    description:
      'Curated candle gift sets for corporate clients, weddings, and special occasions — beautifully packaged and personalised to leave a lasting impression.',
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      'The scent lingers for hours without being overpowering. Lusso candles have transformed my evening routine into something truly special.',
    name: 'Naledi M.',
  },
  {
    quote:
      'I ordered a custom blend for our wedding favours and the team exceeded every expectation. Guests are still asking where they can buy more.',
    name: 'James & Thandi K.',
  },
  {
    quote:
      'Beautiful craftsmanship and sustainable materials — exactly what I look for in a luxury brand. The packaging alone feels like a gift.',
    name: 'Refilwe S.',
  },
] as const;

export const CONTACT_TOPICS = [
  'General Inquiry',
  'Custom Order',
  'Wholesale',
  'Events & Experiences',
  'Feedback',
] as const;

export const GALLERY_IMAGES: GalleryImage[] = [
  {
    src: '/images/gallery/candle-closeup-1.png',
    alt: 'Close-up of a hand-poured soy candle with a cotton wick in a ceramic vessel',
    width: 800,
    height: 1000,
  },
  {
    src: '/images/gallery/styled-trio-1.png',
    alt: 'Trio of Lusso candles arranged on a marble surface with dried botanicals',
    width: 1200,
    height: 800,
  },
  {
    src: '/images/gallery/overhead-workspace.png',
    alt: 'Overhead view of the candle-making workspace with wax, wicks, and fragrance oils',
    width: 1000,
    height: 1000,
  },
  {
    src: '/images/gallery/candle-closeup-2.png',
    alt: 'Close-up of warm amber wax pooling around a lit wick in a glass vessel',
    width: 800,
    height: 1000,
  },
  {
    src: '/images/gallery/styled-trio-2.png',
    alt: 'Trio of candles in neutral tones styled on a linen tablecloth with eucalyptus',
    width: 1200,
    height: 800,
  },
  {
    src: '/images/gallery/overhead-gift-set.png',
    alt: 'Overhead view of a Lusso gift set with three candles nestled in branded packaging',
    width: 1000,
    height: 1000,
  },
];
