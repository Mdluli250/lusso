'use client';

/**
 * ScentQuiz — multi-step questionnaire for scent recommendations.
 *
 * 3 steps: mood, time of day, intensity.
 * On completion, calls /api/quiz/recommend and passes results to QuizResults.
 *
 * Requirements: 6.1, 6.5
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { QuizResults } from './QuizResults';

type Mood = 'relaxing' | 'energizing' | 'romantic' | 'grounding';
type TimeOfDay = 'morning' | 'afternoon' | 'evening';
type Intensity = 'subtle' | 'moderate' | 'bold';

interface QuizAnswers {
  mood: Mood | null;
  timeOfDay: TimeOfDay | null;
  intensity: Intensity | null;
}

interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  scentProfile: string;
  modelPath: string;
}

interface QuizResponse {
  products: RecommendedProduct[];
  message?: string;
}

const STEPS = [
  {
    key: 'mood' as const,
    title: 'What mood are you in?',
    options: [
      { value: 'relaxing', label: 'Relaxing', emoji: '🧘' },
      { value: 'energizing', label: 'Energizing', emoji: '⚡' },
      { value: 'romantic', label: 'Romantic', emoji: '🌹' },
      { value: 'grounding', label: 'Grounding', emoji: '🌿' },
    ],
  },
  {
    key: 'timeOfDay' as const,
    title: 'When will you light it?',
    options: [
      { value: 'morning', label: 'Morning', emoji: '🌅' },
      { value: 'afternoon', label: 'Afternoon', emoji: '☀️' },
      { value: 'evening', label: 'Evening', emoji: '🌙' },
    ],
  },
  {
    key: 'intensity' as const,
    title: 'How strong should the scent be?',
    options: [
      { value: 'subtle', label: 'Subtle', emoji: '🌸' },
      { value: 'moderate', label: 'Moderate', emoji: '🌺' },
      { value: 'bold', label: 'Bold', emoji: '🔥' },
    ],
  },
];

export function ScentQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({
    mood: null,
    timeOfDay: null,
    intensity: null,
  });
  const [results, setResults] = useState<QuizResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentStep = STEPS[step];
  const canGoNext = answers[currentStep?.key] !== null;
  const isLastStep = step === STEPS.length - 1;

  const handleSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentStep.key]: value }));
  };

  const handleNext = async () => {
    if (isLastStep) {
      await fetchRecommendations();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  const handleRetake = () => {
    setStep(0);
    setAnswers({ mood: null, timeOfDay: null, intensity: null });
    setResults(null);
  };

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/quiz/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: answers.mood,
          timeOfDay: answers.timeOfDay,
          intensity: answers.intensity,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  };

  // Show results if we have them
  if (results) {
    return (
      <div className="space-y-6">
        <QuizResults products={results.products} message={results.message} />
        <div className="text-center">
          <Button variant="secondary" size="sm" onClick={handleRetake}>
            Retake Quiz
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={[
              'flex-1 h-1.5 rounded-full transition-colors duration-300',
              i <= step ? 'bg-[var(--theme-accent)]' : 'bg-[var(--theme-accent)]/20',
            ].join(' ')}
            aria-label={`Step ${i + 1} of ${STEPS.length}${i <= step ? ' (completed)' : ''}`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-[var(--theme-accent)] mb-6">
          {currentStep.title}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {currentStep.options.map((option) => {
            const isSelected = answers[currentStep.key] === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={[
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                  isSelected
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10'
                    : 'border-[var(--theme-accent)]/20 hover:border-[var(--theme-accent)]/40 bg-[var(--theme-accent)]/5',
                ].join(' ')}
                aria-pressed={isSelected}
              >
                <span className="text-2xl">{option.emoji}</span>
                <span className="text-sm font-medium text-[var(--theme-accent)]">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={step === 0}
        >
          Back
        </Button>

        <span className="text-xs text-[var(--theme-accent)]/50">
          {step + 1} / {STEPS.length}
        </span>

        <Button
          variant="primary"
          size="sm"
          onClick={handleNext}
          disabled={!canGoNext || isLoading}
        >
          {isLoading ? 'Finding...' : isLastStep ? 'Get Recommendations' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
