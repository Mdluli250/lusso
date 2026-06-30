// Feature: cms-content-management, Property 10: Editor type matches content block type
// Feature: cms-content-management, Property 11: Error state preserves the admin's entered text

/**
 * Property-based tests for the ContentBlockRow and InlineEditor components.
 *
 * Property 10 – Editor type matches content block type
 *
 * For any ContentBlock, the ContentBlockRow component SHALL render:
 *   - <InlineEditor> when block.type is "text", "rich_text", or "image"
 *   - <JsonEditor> (via JsonEditorWrapper) when block.type is "json"
 *
 * This ensures the correct editor type is always mounted for the content type.
 *
 * **Validates: Requirements 4.2, 4.3, 4.4, 4.5**
 *
 * Property 11 – Error state preserves the admin's entered text
 *
 * For any error message returned by upsertContentBlock and for any text the admin
 * has typed into an inline editor, when the server action returns { error }, the
 * editor field's current value SHALL remain equal to the text the admin typed, and
 * the error message SHALL be displayed inline.
 *
 * **Validates: Requirements 4.7**
 */

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import React from 'react';

// ─── Module mock setup ────────────────────────────────────────────────────────

const mockUpsertContentBlock = vi.fn();

vi.mock('@/actions/admin/content', () => ({
  upsertContentBlock: (...args: unknown[]) => mockUpsertContentBlock(...args),
}));

// Mock the JsonEditor component so we can detect when it's rendered
vi.mock('../JsonEditor', () => ({
  JsonEditor: ({ value, onChange, label, blockKey }: { value: string; onChange: (v: string) => void; label?: string; blockKey?: string }) =>
    React.createElement('div', {
      'data-testid': 'json-editor',
      'data-block-key': blockKey,
    }),
}));

// Import after mocks
import { InlineEditor } from '../InlineEditor';
import { ContentBlockRow } from '../ContentBlockRow';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeContentBlock(type: string, key: string, value: string) {
  return {
    id: 'test-id-' + key,
    key,
    type,
    value,
    label: 'Test Label',
    description: null,
    updatedAt: new Date('2025-01-15T10:30:00Z'),
    createdAt: new Date('2025-01-15T10:30:00Z'),
  };
}

// ─── Property 10: Editor type matches content block type ─────────────────────

describe('Property 10: Editor type matches content block type', () => {
  // Feature: cms-content-management, Property 10: Editor type matches content block type
  // **Validates: Requirements 4.2, 4.3, 4.4, 4.5**

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsertContentBlock.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders <InlineEditor> when block.type is "text", "rich_text", or "image"', { timeout: 30000 }, async () => {
    const inlineTypes = ['text', 'rich_text', 'image'] as const;
    const typeArb = fc.constantFrom(...inlineTypes);
    const keyArb = fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0 && !s.includes('\n'));
    const valueArb = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0);

    await fc.assert(
      fc.asyncProperty(typeArb, keyArb, valueArb, async (type, key, value) => {
        cleanup();

        const block = makeContentBlock(type, key, value);

        const { unmount } = render(
          React.createElement(ContentBlockRow, {
            block: block as any,
            fallbackValue: 'fallback-value',
            label: 'Test Block',
          }),
        );

        // Click the Edit button to enter editing mode
        const editButton = screen.getByRole('button', { name: /edit/i });
        fireEvent.click(editButton);

        // InlineEditor renders the appropriate input for text/rich_text/image
        // For text: renders <input type="text">
        // For rich_text: renders <textarea>
        // For image: renders <input type="text"> (URL input)
        // In all these cases, InlineEditor is rendered, NOT JsonEditorWrapper

        // JsonEditor should NOT be rendered for these types
        expect(screen.queryByTestId('json-editor')).toBeNull();

        // Verify the appropriate editor element is present
        if (type === 'text') {
          // Should have an <input type="text">
          const input = screen.getByRole('textbox') as HTMLInputElement;
          expect(input.tagName.toLowerCase()).toBe('input');
          expect(input.type).toBe('text');
        } else if (type === 'rich_text') {
          // Should have a <textarea>
          const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
          expect(textarea.tagName.toLowerCase()).toBe('textarea');
        } else if (type === 'image') {
          // Should have a text input for the URL
          const input = screen.getByRole('textbox') as HTMLInputElement;
          expect(input.tagName.toLowerCase()).toBe('input');
          expect(input.type).toBe('text');
        }

        unmount();
      }),
      { numRuns: 50 },
    );
  });

  it('renders <JsonEditor> (via JsonEditorWrapper) when block.type is "json"', { timeout: 30000 }, async () => {
    const keyArb = fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0 && !s.includes('\n'));

    await fc.assert(
      fc.asyncProperty(keyArb, async (key) => {
        cleanup();

        const block = makeContentBlock('json', key, '[]');

        const { unmount } = render(
          React.createElement(ContentBlockRow, {
            block: block as any,
            fallbackValue: '[]',
            label: 'Test JSON Block',
          }),
        );

        // Click the Edit button to enter editing mode
        const editButton = screen.getByRole('button', { name: /edit/i });
        fireEvent.click(editButton);

        // JsonEditor should be rendered via JsonEditorWrapper
        expect(screen.getByTestId('json-editor')).toBeTruthy();

        // There should NOT be a plain textbox rendered by InlineEditor for the value
        // (The JsonEditorWrapper renders JsonEditor, not a raw input/textarea)
        const textboxes = screen.queryAllByRole('textbox');
        expect(textboxes.length).toBe(0);

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 11: Error state preserves the admin's entered text ─────────────

describe("Property 11: Error state preserves the admin's entered text", () => {
  // Feature: cms-content-management, Property 11: Error state preserves the admin's entered text
  // **Validates: Requirements 4.7**

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('preserves typed text in a text input when upsertContentBlock returns an error', async () => {
    const arbOriginal = fc.string({ minLength: 1, maxLength: 100 });
    const arbTyped = fc.string({ minLength: 1, maxLength: 100 });

    await fc.assert(
      fc.asyncProperty(arbOriginal, arbTyped, async (originalValue, adminTypedValue) => {
        fc.pre(adminTypedValue !== originalValue);

        // Ensure clean DOM state between iterations
        cleanup();

        mockUpsertContentBlock.mockResolvedValue({ error: 'Server error' });

        const onSave = vi.fn();
        const onCancel = vi.fn();

        const block = {
          key: 'test.key',
          type: 'text',
          value: originalValue,
          label: 'Test Block',
        };

        const { unmount } = render(
          React.createElement(InlineEditor, { block, onSave, onCancel }),
        );

        const input = screen.getByRole('textbox') as HTMLInputElement;
        expect(input.value).toBe(originalValue);

        fireEvent.change(input, { target: { value: adminTypedValue } });
        expect(input.value).toBe(adminTypedValue);

        const saveButton = screen.getByRole('button', { name: /save/i });
        await act(async () => {
          fireEvent.click(saveButton);
        });

        await waitFor(() => {
          expect(screen.getByText('Server error')).toBeTruthy();
        });

        expect(input.value).toBe(adminTypedValue);
        expect(onSave).not.toHaveBeenCalled();

        unmount();
        mockUpsertContentBlock.mockClear();
      }),
      { numRuns: 50 },
    );
  }, 30_000);

  it('preserves typed text in a textarea when upsertContentBlock returns an error', async () => {
    const arbOriginal = fc.string({ minLength: 1, maxLength: 200 });
    const arbTyped = fc.string({ minLength: 1, maxLength: 200 });

    await fc.assert(
      fc.asyncProperty(arbOriginal, arbTyped, async (originalValue, adminTypedValue) => {
        fc.pre(adminTypedValue !== originalValue);

        // Ensure clean DOM state between iterations
        cleanup();

        mockUpsertContentBlock.mockResolvedValue({ error: 'Database connection failed' });

        const onSave = vi.fn();
        const onCancel = vi.fn();

        const block = {
          key: 'about_preview.body_1',
          type: 'rich_text',
          value: originalValue,
          label: 'Body Text',
        };

        const { unmount } = render(
          React.createElement(InlineEditor, { block, onSave, onCancel }),
        );

        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(textarea.value).toBe(originalValue);

        fireEvent.change(textarea, { target: { value: adminTypedValue } });
        expect(textarea.value).toBe(adminTypedValue);

        const saveButton = screen.getByRole('button', { name: /save/i });
        await act(async () => {
          fireEvent.click(saveButton);
        });

        await waitFor(() => {
          expect(screen.getByText('Database connection failed')).toBeTruthy();
        });

        expect(textarea.value).toBe(adminTypedValue);
        expect(onSave).not.toHaveBeenCalled();

        unmount();
        mockUpsertContentBlock.mockClear();
      }),
      { numRuns: 50 },
    );
  }, 30_000);

  it('displays the error message returned by upsertContentBlock for arbitrary error strings', async () => {
    // Filter to strings that equal their trimmed form so getByText normalization matches
    const arbErrorMsg = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0 && s === s.trim());
    const arbValue = fc.string({ minLength: 1, maxLength: 100 });

    await fc.assert(
      fc.asyncProperty(arbErrorMsg, arbValue, async (errorMsg, typedValue) => {
        cleanup();

        mockUpsertContentBlock.mockResolvedValue({ error: errorMsg });

        const onSave = vi.fn();
        const onCancel = vi.fn();

        const block = {
          key: 'hero.heading',
          type: 'text',
          value: 'original',
          label: 'Hero Heading',
        };

        const { unmount } = render(
          React.createElement(InlineEditor, { block, onSave, onCancel }),
        );

        const input = screen.getByRole('textbox') as HTMLInputElement;

        fireEvent.change(input, { target: { value: typedValue } });

        const saveButton = screen.getByRole('button', { name: /save/i });
        await act(async () => {
          fireEvent.click(saveButton);
        });

        await waitFor(() => {
          expect(screen.getByText(errorMsg)).toBeTruthy();
        });

        expect(input.value).toBe(typedValue);

        unmount();
        mockUpsertContentBlock.mockClear();
      }),
      { numRuns: 30 },
    );
  }, 30_000);
});
