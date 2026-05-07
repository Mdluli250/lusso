'use client';

/**
 * ReviewModerationActions — Approve/Reject buttons for admin review moderation.
 */

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { moderateReview } from '@/actions/admin/reviews';
import { Button } from '@/components/ui/Button';

interface ReviewModerationActionsProps {
  reviewId: string;
}

export function ReviewModerationActions({ reviewId }: ReviewModerationActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleModerate = (action: 'APPROVE' | 'REJECT') => {
    startTransition(async () => {
      await moderateReview(reviewId, action);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="primary"
        size="sm"
        onClick={() => handleModerate('APPROVE')}
        disabled={isPending}
      >
        Approve
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => handleModerate('REJECT')}
        disabled={isPending}
        className="text-red-500 border-red-500/50 hover:bg-red-500/10"
      >
        Reject
      </Button>
    </div>
  );
}
