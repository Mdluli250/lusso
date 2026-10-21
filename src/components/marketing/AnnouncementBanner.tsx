import { prisma } from '@/lib/prisma';

/**
 * AnnouncementBanner — Server Component.
 * Reads the `announcement.text` and `announcement.active` CMS content blocks.
 * Renders a thin banner above the NavBar when active.
 * Admins configure it at /admin/content.
 */
export async function AnnouncementBanner() {
  try {
    const blocks = await prisma.contentBlock.findMany({
      where: { key: { in: ['announcement.text', 'announcement.active', 'announcement.link', 'announcement.link_label'] } },
      select: { key: true, value: true },
    });

    const map = Object.fromEntries(blocks.map((b) => [b.key, b.value]));
    const active = map['announcement.active'] === 'true';
    const text = map['announcement.text']?.trim();

    if (!active || !text) return null;

    const link = map['announcement.link']?.trim();
    const linkLabel = map['announcement.link_label']?.trim();

    return (
      <div
        role="banner"
        aria-label="Site announcement"
        className="bg-[var(--theme-accent)] text-cream text-xs sm:text-sm text-center px-4 py-2.5 flex items-center justify-center gap-3"
      >
        <span>{text}</span>
        {link && linkLabel && (
          <a
            href={link}
            className="underline font-semibold hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
          >
            {linkLabel}
          </a>
        )}
      </div>
    );
  } catch {
    return null;
  }
}
