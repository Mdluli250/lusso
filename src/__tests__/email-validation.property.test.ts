// Feature: lusso-candles-website, Property 7: Invalid email format is rejected
// **Validates: Requirements 13.4**

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
 * Generator for invalid email strings that should fail the regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 * even after trimming (since submitInquiry trims before validation).
 *
 * Strategies:
 * - Missing @ entirely
 * - Missing domain part after @
 * - Missing TLD (no dot after @)
 * - Contains spaces in local or domain part (internal spaces)
 * - Starts/ends with @
 * - Multiple @ signs
 * - Empty local part
 */
const invalidEmailArb: fc.Arbitrary<string> = fc.oneof(
  // No @ sign at all
  fc.stringMatching(/^[a-z0-9.]{1,30}$/),
  // Starts with @
  fc.stringMatching(/^[a-z0-9.]{1,20}$/).map((s) => `@${s}`),
  // Ends with @
  fc.stringMatching(/^[a-z0-9.]{1,20}$/).map((s) => `${s}@`),
  // Contains spaces in local part (internal, not leading/trailing)
  fc.tuple(
    fc.stringMatching(/^[a-z]{1,10}$/),
    fc.stringMatching(/^[a-z]{1,10}$/),
    fc.stringMatching(/^[a-z]{1,10}$/)
  ).map(([a, b, c]) => `${a} ${b}@${c}.com`),
  // Contains spaces in domain part (internal, not leading/trailing)
  fc.tuple(
    fc.stringMatching(/^[a-z]{1,10}$/),
    fc.stringMatching(/^[a-z]{1,10}$/),
    fc.stringMatching(/^[a-z]{1,10}$/)
  ).map(([a, b, c]) => `${a}@${b} ${c}.com`),
  // No dot in domain (just @domain with no TLD separator)
  fc.tuple(
    fc.stringMatching(/^[a-z]{1,10}$/),
    fc.stringMatching(/^[a-z]{1,10}$/)
  ).map(([local, domain]) => `${local}@${domain}`),
  // Multiple @ signs
  fc.tuple(
    fc.stringMatching(/^[a-z]{1,10}$/),
    fc.stringMatching(/^[a-z]{1,10}$/),
    fc.stringMatching(/^[a-z]{1,10}$/)
  ).map(([a, b, c]) => `${a}@@${b}.${c}`)
);

/**
 * Generator for valid non-empty names.
 */
const validNameArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

/**
 * Generator for a valid topic.
 */
const validTopicArb: fc.Arbitrary<string> = fc.constantFrom(...CONTACT_TOPICS);

/**
 * Generator for valid contact messages.
 */
const validContactMessageArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 2000 })
  .filter((s) => s.trim().length > 0);

/**
 * Generator for valid inquiry messages.
 */
const validInquiryMessageArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 1000 })
  .filter((s) => s.trim().length > 0);

describe('Property 7: Invalid email format is rejected', () => {
  it('submitContactForm rejects any invalid email format', () => {
    fc.assert(
      fc.asyncProperty(
        validNameArb,
        invalidEmailArb,
        validTopicArb,
        validContactMessageArb,
        async (name, email, topic, message) => {
          const result = await submitContactForm({ name, email, topic, message });
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error!.toLowerCase()).toContain('email');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('submitInquiry rejects any invalid email format', () => {
    fc.assert(
      fc.asyncProperty(
        validNameArb,
        invalidEmailArb,
        validInquiryMessageArb,
        async (name, email, message) => {
          const result = await submitInquiry({ name, email, message });
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error!.toLowerCase()).toContain('email');
        }
      ),
      { numRuns: 100 }
    );
  });
});
