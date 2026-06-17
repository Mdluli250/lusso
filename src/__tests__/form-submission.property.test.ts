// Feature: lusso-candles-website, Property 5: Valid form submissions succeed
// **Validates: Requirements 12.4, 13.2**

import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { submitContactForm } from '@/actions/contact';
import { submitInquiry } from '@/actions/experiences';

const CONTACT_TOPICS = [
  'General Inquiry',
  'Custom Order',
  'Wholesale',
  'Events & Experiences',
  'Feedback',
] as const;

/**
 * Generator for valid email addresses matching the regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 * Produces emails like "user@domain.com" with no spaces or @ in local/domain parts.
 */
const validEmailArb: fc.Arbitrary<string> = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9._-]{0,20}$/),
    fc.stringMatching(/^[a-z][a-z0-9-]{0,10}$/),
    fc.stringMatching(/^[a-z]{2,6}$/)
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`)
  .filter((email) => email.length <= 254);

/**
 * Generator for valid non-empty names (1-100 chars, no leading/trailing whitespace only).
 */
const validNameArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

/**
 * Generator for a valid topic from the predefined list.
 */
const validTopicArb: fc.Arbitrary<string> = fc.constantFrom(...CONTACT_TOPICS);

/**
 * Generator for valid contact form messages (1-2000 chars, non-empty after trim).
 */
const validContactMessageArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 2000 })
  .filter((s) => s.trim().length > 0);

/**
 * Generator for valid inquiry messages (1-1000 chars, non-empty after trim).
 */
const validInquiryMessageArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 1000 })
  .filter((s) => s.trim().length > 0);

describe('Property 5: Valid form submissions succeed', () => {
  it('submitContactForm returns success for any valid contact form data', () => {
    fc.assert(
      fc.asyncProperty(
        validNameArb,
        validEmailArb,
        validTopicArb,
        validContactMessageArb,
        async (name, email, topic, message) => {
          const result = await submitContactForm({ name, email, topic, message });
          expect(result.success).toBe(true);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('submitInquiry returns success for any valid inquiry form data', () => {
    fc.assert(
      fc.asyncProperty(
        validNameArb,
        validEmailArb,
        validInquiryMessageArb,
        async (name, email, message) => {
          const result = await submitInquiry({ name, email, message });
          expect(result.success).toBe(true);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
