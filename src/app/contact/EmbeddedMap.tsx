'use client';

import { useState } from 'react';
import { BUSINESS_INFO } from '@/lib/constants/brand';

/**
 * EmbeddedMap — client component for the Google Maps iframe.
 *
 * Uses useState to track load errors and display a text fallback
 * showing the business address when the map fails to load.
 *
 * Requirements: 13.6
 */
export function EmbeddedMap() {
  const [mapError, setMapError] = useState(false);

  if (mapError) {
    return (
      <div
        className="flex items-center justify-center min-h-[200px] min-w-[300px] bg-cream rounded-lg border border-taupe p-6"
        role="img"
        aria-label="Map showing business location"
      >
        <p className="text-warm-grey text-center text-base leading-relaxed">
          {BUSINESS_INFO.address}
        </p>
      </div>
    );
  }

  return (
    <iframe
      src={BUSINESS_INFO.mapEmbedUrl}
      title="Lusso Candles location on Google Maps"
      className="w-full rounded-lg border border-taupe"
      style={{ minWidth: '300px', minHeight: '200px' }}
      width="100%"
      height="350"
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      onError={() => setMapError(true)}
    />
  );
}
