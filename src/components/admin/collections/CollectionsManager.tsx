"use client";

import { useState } from "react";
import type { CollectionCard } from "@/actions/admin/collections";
import { saveCollections, saveCollectionsHeading } from "@/actions/admin/collections";
import { CollectionCardForm } from "./CollectionCardForm";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";

interface CollectionsManagerProps {
  initialCards: CollectionCard[];
  initialHeading: string;
}

type FormMode = { type: "create" } | { type: "edit"; index: number };

interface Feedback {
  type: "success" | "error";
  message: string;
}

/**
 * CollectionsManager — client component for managing homepage collection cards.
 *
 * Provides add/edit/delete/reorder operations on collection cards and
 * heading editing. Persists all changes via server actions.
 *
 * Requirements: 2.1, 2.2, 2.4, 2.5, 2.7, 2.8, 2.9, 2.10, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 9.1
 */
export function CollectionsManager({ initialCards, initialHeading }: CollectionsManagerProps) {
  const [cards, setCards] = useState<CollectionCard[]>(initialCards);
  const [heading, setHeading] = useState(initialHeading);
  const [headingDraft, setHeadingDraft] = useState(initialHeading);

  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  // ─── Feedback helpers ───────────────────────────────────────────

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    if (type === "success") {
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  // ─── Persist cards ──────────────────────────────────────────────

  async function persistCards(updatedCards: CollectionCard[]) {
    setSaving(true);
    const result = await saveCollections(updatedCards);
    setSaving(false);

    if ("error" in result) {
      showFeedback("error", result.error);
      return false;
    }
    showFeedback("success", "Collections saved successfully");
    return true;
  }

  // ─── Add Card ───────────────────────────────────────────────────

  function handleAddClick() {
    if (cards.length >= 6) {
      showFeedback("error", "Maximum of 6 collections allowed. Remove one before adding another.");
      return;
    }
    setFormMode({ type: "create" });
  }

  async function handleFormSubmit(cardData: Omit<CollectionCard, "displayOrder">) {
    if (formMode?.type === "create") {
      const newCard: CollectionCard = {
        ...cardData,
        displayOrder: cards.length,
      };
      const updatedCards = [...cards, newCard];
      const success = await persistCards(updatedCards);
      if (success) {
        setCards(updatedCards);
      }
    } else if (formMode?.type === "edit") {
      const updatedCards = cards.map((c, i) =>
        i === formMode.index ? { ...cardData, displayOrder: c.displayOrder } : c
      );
      const success = await persistCards(updatedCards);
      if (success) {
        setCards(updatedCards);
      }
    }
    setFormMode(null);
  }

  // ─── Edit Card ──────────────────────────────────────────────────

  function handleEditClick(index: number) {
    setFormMode({ type: "edit", index });
  }

  // ─── Delete Card ────────────────────────────────────────────────

  function handleDeleteClick(index: number) {
    if (cards.length <= 1) {
      showFeedback("error", "At least one collection must remain. Cannot delete the last card.");
      return;
    }
    setDeleteIndex(index);
  }

  async function handleDeleteConfirm() {
    if (deleteIndex === null) return;

    const updatedCards = cards
      .filter((_, i) => i !== deleteIndex)
      .map((card, i) => ({ ...card, displayOrder: i }));

    const success = await persistCards(updatedCards);
    if (success) {
      setCards(updatedCards);
    }
    setDeleteIndex(null);
  }

  // ─── Reorder ────────────────────────────────────────────────────

  async function handleMoveUp(index: number) {
    if (index === 0) return;
    const updatedCards = [...cards];
    [updatedCards[index - 1], updatedCards[index]] = [updatedCards[index], updatedCards[index - 1]];
    const renumbered = updatedCards.map((card, i) => ({ ...card, displayOrder: i }));
    const success = await persistCards(renumbered);
    if (success) {
      setCards(renumbered);
    }
  }

  async function handleMoveDown(index: number) {
    if (index >= cards.length - 1) return;
    const updatedCards = [...cards];
    [updatedCards[index], updatedCards[index + 1]] = [updatedCards[index + 1], updatedCards[index]];
    const renumbered = updatedCards.map((card, i) => ({ ...card, displayOrder: i }));
    const success = await persistCards(renumbered);
    if (success) {
      setCards(renumbered);
    }
  }

  // ─── Heading ────────────────────────────────────────────────────

  async function handleHeadingSave() {
    if (headingDraft.length > 60) {
      showFeedback("error", "Heading must be 60 characters or less");
      return;
    }
    setSaving(true);
    const result = await saveCollectionsHeading(headingDraft);
    setSaving(false);

    if ("error" in result) {
      showFeedback("error", result.error);
      return;
    }
    setHeading(headingDraft);
    showFeedback("success", "Heading saved successfully");
  }

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Collections Management</h1>
        <p className="text-sm text-muted mt-1">
          Manage the &ldquo;Our Collections&rdquo; section displayed on the homepage. Up to 6 cards.
        </p>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={[
            "px-4 py-3 rounded-lg text-sm font-medium border",
            feedback.type === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-600"
              : "bg-red-500/10 border-red-500/20 text-red-500",
          ].join(" ")}
          role="alert"
        >
          {feedback.message}
          {feedback.type === "error" && (
            <button
              onClick={() => setFeedback(null)}
              className="ml-3 text-xs underline hover:no-underline"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Section heading editor */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Section Heading
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1">
            <input
              type="text"
              value={headingDraft}
              onChange={(e) => setHeadingDraft(e.target.value)}
              maxLength={61}
              placeholder="Our Collections"
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
              aria-label="Section heading"
            />
            <p className="text-xs text-muted">
              {headingDraft.length}/60 characters
              {headingDraft.length > 60 && (
                <span className="text-red-400 ml-2">Exceeds maximum length</span>
              )}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleHeadingSave}
            disabled={saving || headingDraft === heading || headingDraft.length > 60}
          >
            Save Heading
          </Button>
        </div>
      </div>

      {/* Collection cards list */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Collection Cards ({cards.length}/6)
          </h2>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddClick}
            disabled={cards.length >= 6 || saving}
          >
            + Add Collection
          </Button>
        </div>

        {cards.length === 0 ? (
          <p className="text-sm text-muted py-4 text-center">
            No collections configured. Click &ldquo;Add Collection&rdquo; to create your first card.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {cards.map((card, index) => (
              <div
                key={`${card.displayOrder}-${card.title}`}
                className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
              >
                {/* Position number */}
                <span className="text-lg font-bold text-muted w-6 text-center shrink-0">
                  {index + 1}
                </span>

                {/* Image thumbnail */}
                <div className="shrink-0">
                  {card.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={card.imageUrl}
                      alt={card.title}
                      className="h-14 w-14 rounded-md object-cover border border-border"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-md border border-dashed border-border bg-surface-muted flex items-center justify-center">
                      <span className="text-xs text-muted">No img</span>
                    </div>
                  )}
                </div>

                {/* Card info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {card.title}
                  </p>
                  {card.description && (
                    <p className="text-xs text-muted truncate mt-0.5">
                      {card.description}
                    </p>
                  )}
                  <p className="text-xs text-muted mt-0.5">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-surface-muted border border-border font-mono">
                      {card.filterParam}
                    </span>
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Move up */}
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0 || saving}
                    className="p-1.5 text-xs rounded-md border border-border text-muted hover:text-foreground hover:bg-surface-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                    aria-label={`Move ${card.title} up`}
                  >
                    ↑
                  </button>
                  {/* Move down */}
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === cards.length - 1 || saving}
                    className="p-1.5 text-xs rounded-md border border-border text-muted hover:text-foreground hover:bg-surface-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                    aria-label={`Move ${card.title} down`}
                  >
                    ↓
                  </button>
                  {/* Edit */}
                  <button
                    onClick={() => handleEditClick(index)}
                    disabled={saving}
                    className="px-2 py-1.5 text-xs rounded-md border border-border text-theme-accent hover:bg-surface-muted transition-colors disabled:opacity-50"
                    title="Edit card"
                    aria-label={`Edit ${card.title}`}
                  >
                    Edit
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteClick(index)}
                    disabled={saving}
                    className="px-2 py-1.5 text-xs rounded-md border border-border text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    title="Delete card"
                    aria-label={`Delete ${card.title}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CollectionCardForm modal */}
      {formMode && (
        <CollectionCardForm
          card={formMode.type === "edit" ? cards[formMode.index] : undefined}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormMode(null)}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteIndex !== null}
        title="Delete Collection Card"
        message={
          deleteIndex !== null
            ? `Are you sure you want to delete "${cards[deleteIndex]?.title}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteIndex(null)}
      />
    </div>
  );
}
