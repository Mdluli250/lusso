import type { Metadata } from 'next';
import { ScentQuiz } from '@/components/quiz/ScentQuiz';

/**
 * Quiz page — hosts the ScentQuiz component.
 *
 * Requirements: 6.1
 */

export const metadata: Metadata = {
  title: 'Find Your Scent',
  description:
    'Take our interactive scent quiz to discover the perfect Lusso candle for your mood and space.',
};

export default function QuizPage() {
  return (
    <main className="min-h-screen bg-[var(--theme-bg)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[var(--theme-accent)] mb-3">
            Find Your Perfect Scent
          </h1>
          <p className="text-[var(--theme-accent)]/60">
            Answer a few questions and we&apos;ll recommend the ideal candle for you.
          </p>
        </div>

        <ScentQuiz />
      </div>
    </main>
  );
}
