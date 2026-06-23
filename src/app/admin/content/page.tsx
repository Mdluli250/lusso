import Link from 'next/link';
import { TESTIMONIALS, SERVICES, BUSINESS_INFO } from '@/lib/constants/brand';

/**
 * Admin Content page — overview of site content that can be edited
 * by updating brand.ts constants or via the DB.
 */
export default function AdminContentPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Content Management</h1>
        <p className="text-sm text-muted mt-1">
          Manage site content. Static content is in{' '}
          <code className="text-xs bg-surface-muted px-1.5 py-0.5 rounded">src/lib/constants/brand.ts</code>.
          Dynamic content (products, orders) is in the database.
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: 'Products', desc: 'Add, edit, delete candle products', href: '/admin/products', icon: '🕯️' },
          { title: 'Gallery', desc: 'Update homepage gallery images', href: '/admin/gallery', icon: '🖼️' },
          { title: 'Bundles', desc: 'View bundle pricing & availability', href: '/admin/bundles', icon: '🎁' },
          { title: 'Reviews', desc: 'Moderate customer reviews', href: '/admin/reviews', icon: '⭐' },
          { title: 'Inventory', desc: 'Update stock levels', href: '/admin/inventory', icon: '📦' },
          { title: 'Customers', desc: 'View customer accounts', href: '/admin/customers', icon: '👥' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-start gap-3 p-4 rounded-lg border border-border bg-surface hover:bg-surface-muted transition-colors"
          >
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted mt-0.5">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Business info */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Business Information</h2>
          <span className="text-xs text-muted">Edit in brand.ts</span>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted">Address</dt>
            <dd className="text-foreground">{BUSINESS_INFO.address}</dd>
          </div>
          <div>
            <dt className="text-muted">Hours</dt>
            <dd className="text-foreground">{BUSINESS_INFO.hours}</dd>
          </div>
          <div>
            <dt className="text-muted">Phone</dt>
            <dd className="text-foreground">{BUSINESS_INFO.phone}</dd>
          </div>
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="text-foreground">{BUSINESS_INFO.email}</dd>
          </div>
        </dl>
      </div>

      {/* Testimonials */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Testimonials ({TESTIMONIALS.length})
          </h2>
          <span className="text-xs text-muted">Edit in brand.ts → TESTIMONIALS</span>
        </div>
        <div className="space-y-3">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="p-3 rounded-lg bg-surface-muted text-sm">
              <p className="text-foreground italic">"{t.quote}"</p>
              <p className="text-muted mt-1">— {t.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Services ({SERVICES.length})
          </h2>
          <span className="text-xs text-muted">Edit in brand.ts → SERVICES</span>
        </div>
        <div className="space-y-3">
          {SERVICES.map((s, i) => (
            <div key={i} className="p-3 rounded-lg bg-surface-muted text-sm">
              <p className="font-medium text-foreground">{s.name}</p>
              <p className="text-muted mt-1">{s.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Edit instructions */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-5 space-y-2">
        <h2 className="text-sm font-semibold text-amber-600">Editing static content</h2>
        <p className="text-sm text-muted">
          Testimonials, services, business hours, and social links are stored in{' '}
          <code className="text-xs bg-white/50 px-1 rounded">src/lib/constants/brand.ts</code>.
          Edit that file directly and redeploy to update this content on the site.
        </p>
      </div>
    </div>
  );
}
