import { redirect } from "next/navigation";

/**
 * /collections — permanent redirect to the canonical shop page /collection.
 *
 * All "Shop" links, hero CTAs, and collection preview cards now point to
 * /collection which has the full interactive FilterPanel + ProductGrid.
 * This redirect preserves any existing bookmarks or external links.
 */
export default function CollectionsRedirectPage() {
  redirect("/collection");
}
