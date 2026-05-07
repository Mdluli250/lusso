'use client';

import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

/**
 * ConfirmDialog — modal confirmation dialog with destructive variant.
 * Uses native <dialog> element for accessibility. Traps focus when open.
 *
 * Requirements: 6.2, 10.5
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Handle backdrop click
  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      onCancel();
    }
  }

  // Handle Escape key (native dialog behavior, but we sync state)
  function handleCancel(e: React.SyntheticEvent) {
    e.preventDefault();
    onCancel();
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className="backdrop:bg-black/50 bg-surface border border-border rounded-xl p-0 max-w-md w-full shadow-xl"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div className="p-6">
        <h2
          id="confirm-dialog-title"
          className="text-lg font-semibold text-foreground mb-2"
        >
          {title}
        </h2>
        <p id="confirm-dialog-message" className="text-sm text-muted mb-6">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-md border border-border text-foreground hover:bg-surface-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={[
              'px-4 py-2 text-sm rounded-md font-medium transition-colors',
              destructive
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-theme-accent text-white hover:opacity-90',
            ].join(' ')}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
