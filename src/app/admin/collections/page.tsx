import { getAdminCollections, getCollectionsHeading } from "@/lib/collections";
import { CollectionsManager } from "@/components/admin/collections/CollectionsManager";

/**
 * Admin Collections Management page — async Server Component.
 *
 * Fetches the current collection cards and heading from the ContentBlock store,
 * then passes them to the CollectionsManager client component for editing.
 *
 * No duplicate auth guard needed — src/app/admin/layout.tsx already handles it.
 *
 * Requirements: 2.1, 8.2
 */
export default async function AdminCollectionsPage() {
  const [collections, heading] = await Promise.all([
    getAdminCollections(),
    getCollectionsHeading(),
  ]);

  return (
    <CollectionsManager
      initialCards={collections ?? []}
      initialHeading={heading ?? "Our Collections"}
    />
  );
}
