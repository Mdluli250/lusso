import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Candle Care Guide',
  description: 'How to get the most from your Lusso candle. Wick trimming, first burn, safety, and jar reuse tips.',
};

const TIPS = [
  {
    icon: '✂️',
    heading: 'Trim the wick before every burn',
    body: 'Keep the wick trimmed to 5mm (about ¼ inch) before lighting. A long wick creates a large, flickering flame that produces soot and burns through wax unevenly. Use a wick trimmer or small scissors.',
  },
  {
    icon: '🕯️',
    heading: 'The first burn is the most important',
    body: 'On your first burn, allow the wax pool to reach the edges of the vessel before extinguishing — typically 2–3 hours. This prevents "tunnelling" where a well forms down the centre and wasted wax clings to the sides.',
  },
  {
    icon: '⏱️',
    heading: 'Burn for no more than 4 hours',
    body: 'Extended burns cause the wick to "mushroom" and the jar to overheat. After 4 hours, extinguish the flame, let the wax solidify, trim the wick, and relight when ready.',
  },
  {
    icon: '🌬️',
    heading: 'Use a snuffer, not your breath',
    body: 'Blowing out a candle can spray hot wax and push the wick off-centre. A candle snuffer smothers the flame cleanly. If you don\'t have one, place a small non-flammable lid over the jar briefly.',
  },
  {
    icon: '📍',
    heading: 'Keep it on a stable, heat-resistant surface',
    body: 'Place your candle on a coaster or heat-resistant mat away from draughts, flammable materials, and out of reach of children and pets. Never leave a burning candle unattended.',
  },
  {
    icon: '🧊',
    heading: 'Reuse your jar',
    body: 'Once ≈5mm of wax remains, stop burning — a nearly empty vessel can overheat. Pop the jar in the freezer for 30 minutes; the remaining wax will shrink and lift out easily. Wash with warm soapy water and repurpose the jar.',
  },
  {
    icon: '🌡️',
    heading: 'Store away from heat and light',
    body: 'Soy and beeswax can soften or discolour in direct sunlight or heat. Store unlit candles in a cool, dry place, ideally in the original packaging, to preserve the fragrance.',
  },
  {
    icon: '❄️',
    heading: 'White frost is normal on soy candles',
    body: 'Soy wax is a natural product and may develop a white, powdery "bloom" on the surface over time. This does not affect burn quality or scent — it is simply a characteristic of natural wax.',
  },
];

export default function CandleCarePage() {
  return (
    <div className="min-h-screen bg-[var(--theme-bg)]">
      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">

        <header className="mb-14 text-center">
          <p className="text-3xl mb-3">🕯️</p>
          <h1 className="text-4xl font-bold text-[var(--theme-accent)] mb-4">Candle Care Guide</h1>
          <p className="text-[var(--theme-accent)]/60 max-w-xl mx-auto">
            Follow these simple tips to get the most beautiful, longest-lasting burn from every Lusso candle.
          </p>
        </header>

        <ul className="space-y-6" role="list">
          {TIPS.map((tip) => (
            <li
              key={tip.heading}
              className="flex gap-5 rounded-2xl border border-[var(--theme-accent)]/10 bg-[var(--theme-accent)]/3 px-5 py-5"
            >
              <span className="text-2xl shrink-0 mt-0.5" aria-hidden="true">{tip.icon}</span>
              <div>
                <h2 className="font-semibold text-[var(--theme-accent)] mb-1">{tip.heading}</h2>
                <p className="text-sm text-[var(--theme-accent)]/70 leading-relaxed">{tip.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-16 rounded-xl border border-[var(--theme-accent)]/15 bg-[var(--theme-accent)]/5 px-6 py-6 space-y-3">
          <h2 className="font-semibold text-[var(--theme-accent)]">Safety reminder</h2>
          <ul className="text-sm text-[var(--theme-accent)]/70 space-y-1 list-disc pl-4">
            <li>Never leave a burning candle unattended.</li>
            <li>Keep away from children and pets.</li>
            <li>Do not burn on or near anything flammable.</li>
            <li>Keep away from draughts and air conditioning vents.</li>
            <li>Discontinue use when ≈5mm of wax remains.</li>
          </ul>
        </div>

        <p className="mt-10 text-center text-sm text-[var(--theme-accent)]/50">
          Questions? <Link href="/contact" className="underline hover:no-underline">Contact us</Link> or read our <Link href="/faq" className="underline hover:no-underline">FAQ</Link>.
        </p>
      </div>
    </div>
  );
}
