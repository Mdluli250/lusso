// Feature: lusso-candles-website, Property 9: Form inputs have associated labels
// **Validates: Requirements 16.8**

// @vitest-environment jsdom

import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';

// Mock server actions
vi.mock('@/actions/contact', () => ({
  submitContactForm: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/actions/experiences', () => ({
  submitInquiry: vi.fn().mockResolvedValue({ success: true }),
}));

/**
 * Property 9: For any form input element rendered on the website, there should
 * exist either a <label> element with a `for` attribute matching the input's `id`,
 * or the input should have an `aria-label` or `aria-labelledby` attribute.
 *
 * Test approach:
 * - Render the ContactForm and InquiryForm components
 * - For each input/textarea/select element, verify it has either:
 *   - A matching <label> with `for` attribute = input's `id`
 *   - Or an `aria-label` attribute
 *   - Or an `aria-labelledby` attribute
 * - Use fast-check to generate random form configurations and verify the property
 */

/**
 * Checks whether a form input element has a proper label association.
 * Returns true if the input has:
 * 1. A matching <label> with htmlFor === input.id, OR
 * 2. An aria-label attribute, OR
 * 3. An aria-labelledby attribute
 */
function hasValidLabelAssociation(
  input: HTMLElement,
  container: HTMLElement
): boolean {
  const id = input.getAttribute('id');
  const ariaLabel = input.getAttribute('aria-label');
  const ariaLabelledBy = input.getAttribute('aria-labelledby');

  // Check for aria-label
  if (ariaLabel && ariaLabel.trim().length > 0) {
    return true;
  }

  // Check for aria-labelledby
  if (ariaLabelledBy && ariaLabelledBy.trim().length > 0) {
    return true;
  }

  // Check for matching <label> with for attribute
  if (id) {
    const matchingLabel = container.querySelector(`label[for="${id}"]`);
    if (matchingLabel) {
      return true;
    }
  }

  return false;
}

/**
 * Gets all form input elements (input, textarea, select) from a container.
 */
function getFormInputs(container: HTMLElement): HTMLElement[] {
  const inputs = container.querySelectorAll('input, textarea, select');
  return Array.from(inputs) as HTMLElement[];
}

describe('Property 9: Form inputs have associated labels', () => {
  afterEach(() => {
    cleanup();
  });

  describe('ContactForm label associations', () => {
    it('every input/textarea/select in ContactForm has a valid label association', async () => {
      const { ContactForm } = await import('@/components/contact/ContactForm');

      fc.assert(
        fc.property(fc.constant(null), () => {
          const { container, unmount } = render(React.createElement(ContactForm));

          const inputs = getFormInputs(container);

          // ContactForm should have at least 4 inputs (name, email, topic, message)
          expect(inputs.length).toBeGreaterThanOrEqual(4);

          for (const input of inputs) {
            const tagName = input.tagName.toLowerCase();
            const inputId = input.getAttribute('id') || 'unknown';
            expect(
              hasValidLabelAssociation(input, container),
              `${tagName}#${inputId} should have a valid label association`
            ).toBe(true);
          }

          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('each ContactForm input has a unique id', async () => {
      const { ContactForm } = await import('@/components/contact/ContactForm');

      fc.assert(
        fc.property(fc.constant(null), () => {
          const { container, unmount } = render(React.createElement(ContactForm));

          const inputs = getFormInputs(container);
          const ids = inputs
            .map((input) => input.getAttribute('id'))
            .filter((id): id is string => id !== null);

          // All ids should be unique
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);

          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('each ContactForm label for attribute matches exactly one input id', async () => {
      const { ContactForm } = await import('@/components/contact/ContactForm');

      fc.assert(
        fc.property(fc.constant(null), () => {
          const { container, unmount } = render(React.createElement(ContactForm));

          const labels = container.querySelectorAll('label[for]');

          for (const label of Array.from(labels)) {
            const forAttr = label.getAttribute('for');
            expect(forAttr).toBeTruthy();

            // The for attribute should match exactly one input's id
            const matchingInputs = container.querySelectorAll(`[id="${forAttr}"]`);
            expect(
              matchingInputs.length,
              `label[for="${forAttr}"] should match exactly one input with id="${forAttr}"`
            ).toBe(1);
          }

          unmount();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('InquiryForm label associations', () => {
    it('every input/textarea in InquiryForm has a valid label association', async () => {
      const { InquiryForm } = await import(
        '@/components/experiences/InquiryForm'
      );

      fc.assert(
        fc.property(fc.constant(null), () => {
          const { container, unmount } = render(React.createElement(InquiryForm));

          const inputs = getFormInputs(container);

          // InquiryForm should have at least 3 inputs (name, email, message)
          expect(inputs.length).toBeGreaterThanOrEqual(3);

          for (const input of inputs) {
            const tagName = input.tagName.toLowerCase();
            const inputId = input.getAttribute('id') || 'unknown';
            expect(
              hasValidLabelAssociation(input, container),
              `${tagName}#${inputId} should have a valid label association`
            ).toBe(true);
          }

          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('each InquiryForm input has a unique id', async () => {
      const { InquiryForm } = await import(
        '@/components/experiences/InquiryForm'
      );

      fc.assert(
        fc.property(fc.constant(null), () => {
          const { container, unmount } = render(React.createElement(InquiryForm));

          const inputs = getFormInputs(container);
          const ids = inputs
            .map((input) => input.getAttribute('id'))
            .filter((id): id is string => id !== null);

          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);

          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('each InquiryForm label for attribute matches exactly one input id', async () => {
      const { InquiryForm } = await import(
        '@/components/experiences/InquiryForm'
      );

      fc.assert(
        fc.property(fc.constant(null), () => {
          const { container, unmount } = render(React.createElement(InquiryForm));

          const labels = container.querySelectorAll('label[for]');

          for (const label of Array.from(labels)) {
            const forAttr = label.getAttribute('for');
            expect(forAttr).toBeTruthy();

            const matchingInputs = container.querySelectorAll(`[id="${forAttr}"]`);
            expect(
              matchingInputs.length,
              `label[for="${forAttr}"] should match exactly one input with id="${forAttr}"`
            ).toBe(1);
          }

          unmount();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Label association property with generated form configurations', () => {
    /**
     * Generator for form field configurations.
     * Simulates different form structures to verify the property holds.
     */
    const formFieldArb = fc.record({
      id: fc.stringMatching(/^[a-z][a-z0-9-]{2,20}$/).filter((s) => s.length >= 3),
      type: fc.constantFrom('text', 'email', 'tel', 'textarea', 'select'),
      labelText: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
      labelMethod: fc.constantFrom('for-id', 'aria-label', 'aria-labelledby'),
    });

    it('any form input with a proper label method satisfies the label association property', () => {
      fc.assert(
        fc.property(
          fc.array(formFieldArb, { minLength: 1, maxLength: 8 }),
          (fields) => {
            // Ensure unique ids
            const uniqueFields = fields.reduce<typeof fields>((acc, field) => {
              if (!acc.some((f) => f.id === field.id)) {
                acc.push(field);
              }
              return acc;
            }, []);

            // Build a form DOM structure based on generated fields
            const formElements: React.ReactElement[] = [];

            for (const field of uniqueFields) {
              const inputProps: Record<string, string> = { id: field.id };

              if (field.labelMethod === 'aria-label') {
                inputProps['aria-label'] = field.labelText;
              } else if (field.labelMethod === 'aria-labelledby') {
                inputProps['aria-labelledby'] = `${field.id}-label`;
              }

              if (field.labelMethod === 'for-id') {
                formElements.push(
                  React.createElement('label', { key: `label-${field.id}`, htmlFor: field.id }, field.labelText)
                );
              } else if (field.labelMethod === 'aria-labelledby') {
                formElements.push(
                  React.createElement('span', { key: `span-${field.id}`, id: `${field.id}-label` }, field.labelText)
                );
              }

              if (field.type === 'textarea') {
                formElements.push(
                  React.createElement('textarea', { key: field.id, ...inputProps })
                );
              } else if (field.type === 'select') {
                formElements.push(
                  React.createElement('select', { key: field.id, ...inputProps },
                    React.createElement('option', { value: '' }, 'Select...')
                  )
                );
              } else {
                formElements.push(
                  React.createElement('input', { key: field.id, type: field.type, ...inputProps })
                );
              }
            }

            const form = React.createElement('form', null, ...formElements);
            const { container, unmount } = render(form);

            const inputs = getFormInputs(container);

            for (const input of inputs) {
              expect(hasValidLabelAssociation(input, container)).toBe(true);
            }

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
