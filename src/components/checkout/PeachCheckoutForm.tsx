'use client';

import { useEffect, useRef } from 'react';

interface PeachCheckoutFormProps {
  checkoutId: string;
}

export default function PeachCheckoutForm({ checkoutId }: PeachCheckoutFormProps) {
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    const scriptUrl = process.env.NEXT_PUBLIC_PEACH_SCRIPT_URL
      || 'https://eu-test.oppwa.com/v1/paymentWidgets.js';

    const script = document.createElement('script');
    script.src = `${scriptUrl}?checkoutId=${checkoutId}`;
    script.async = true;
    scriptRef.current = script;
    document.body.appendChild(script);

    return () => {
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        document.body.removeChild(scriptRef.current);
      }
    };
  }, [checkoutId]);

  return (
    <div className="w-full max-w-lg mx-auto">
      <form
        action={`${process.env.NEXT_PUBLIC_PEACH_SHOPPER_RESULT_URL || '/success'}`}
        className="paymentWidgets"
        data-brands="VISA MASTER AMEX"
      />
    </div>
  );
}
