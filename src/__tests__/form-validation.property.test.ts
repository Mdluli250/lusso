// Feature: lusso-candles-website, Property 6: Missing required fields produce validation errors
// **Validates: Requirements 12.5, 13.3**

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
 * Generator for valid email addresses.
 */
const validEmailArb: fc.Arbitrary<string> = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9._-]{0,20}$/),
    fc.stringMatching(/^[a-z][a-z0-9-]{0,10}$/),
    fc.stringMatching(/^[a-z]{2,6}$/)
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/**
 * Generator for valid non-empty strings.
 */
const validStringArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

/**
 * Generator for empty/whitespace-only strings (simulates missing required fields).
 */
const emptyOrWhitespaceArb: fc.Arbitrary<string> = fc.constantFrom('', ' ', '  ', '\t', '\n', '   \t\n  ');

/**
 * Generator for a valid topic.
 */
const validTopicArb: fc.Arbitrary<string> = fc.constantFrom(...CONTACT_TOPICS);

/**
 * Generator for valid messages within contact form limits.
 */
const validContactMessageArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 2000 })
  .filter((s) => s.trim().length > 0);

/**
 * Generator for valid messages within inquiry form limits.
 */
const validInquiryMessageArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 1000 })
  .filter((s) => s.trim().length > 0);

describe('Property 6: Missing required fields produce validation errors', () => {
  it('submitContactForm rejects when name is empty/whitespace', () => {
    fc.assert(
      fc.asyncProperty(
        emptyOrWhitespaceArb,
        validEmailArb,
        validTopicArb,
        validContactMessageArb,
        async (name, email, topic, message) => {
          const result = await submitContactForm({ name, email, topic, message });
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('submitContactForm rejects when email is empty/whitespace', () => {
    fc.assert(
      fc.asyncProperty(
        validStringArb,
        emptyOrWhitespaceArb,
        validTopicArb,
        validContactMessageArb,
        async (name, email, topic, message) => {
          const result = await submitContactForm({ name, email, topic, message });
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('submitContactForm rejects when topic is empty/whitespace', () => {
    fc.assert(
      fc.asyncProperty(
        validStringArb,
        validEmailArb,
        emptyOrWhitespaceArb,
        validContactMessageArb,
        async (name, email, topic, message) => {
          const result = await submitContactForm({ name, email, topic, message });
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('submitContactForm rejects when message is empty/whitespace', () => {
    fc.assert(
      fc.asyncProperty(
        validStringArb,
        validEmailArb,
        validTopicArb,
        emptyOrWhitespaceArb,
        async (name, email, topic, message) => {
          const result = await submitContactForm({ name, email, topic, message });
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('submitInquiry rejects when name is empty/whitespace', () => {
    fc.assert(
      fc.asyncProperty(
        emptyOrWhitespaceArb,
        validEmailArb,
        validInquiryMessageArb,
        async (name, email, message) => {
          const result = await submitInquiry({ name, email, message });
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('submitInquiry rejects when email is empty/whitespace', () => {
    fc.assert(
      fc.asyncProperty(
        validStringArb,
        emptyOrWhitespaceArb,
        validInquiryMessageArb,
        async (name, email, message) => {
          const result = await submitInquiry({ name, email, message });
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('submitInquiry rejects when message is empty/whitespace', () => {
    fc.assert(
      fc.asyncProperty(
        validStringArb,
        validEmailArb,
        emptyOrWhitespaceArb,
        async (name, email, message) => {
          const result = await submitInquiry({ name, email, message });
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
