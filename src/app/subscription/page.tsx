import { redirect } from 'next/navigation';

/**
 * /subscription — permanent redirect to the dashboard subscriptions page.
 * Any links or bookmarks pointing to /subscription will land correctly.
 */
export default function SubscriptionPage() {
  redirect('/dashboard/subscriptions');
}
