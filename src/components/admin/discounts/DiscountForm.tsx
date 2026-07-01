"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generatePromoCode } from "@/lib/discounts/calculate";

// ─── Types ────────────────────────────────────────────────────────

type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";

export interface DiscountFormData {
  code: string;
  type: DiscountType;
  value: number;
  minOrderAmountZAR: number;
  maxUsageCount: number | null;
  perUserLimit: number | null;
  maxDiscountAmountZAR: number | null;
  stackable: boolean;
  startDate: string | null;
  endDate: string | null;
  applicableProductIds: string[];
}

export interface DiscountInitialData {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrderAmountZAR: number;
  maxUsageCount: number | null;
  perUserLimit: number | null;
  maxDiscountAmountZAR: number | null;
  stackable: boolean;
  startDate: Date | string | null;
  endDate: Date | string | null;
  applicableProductIds: string[];
}

interface DiscountFormProps {
  mode: "create" | "edit";
  initialData?: DiscountInitialData;
  onSubmit: (data: DiscountFormData) => Promise<{ id?: string; success?: true; error?: string }>;
}

// ─── Helpers ──────────────────────────────────────────────────────

function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
}

// ─── Component ────────────────────────────────────────────────────

export function DiscountForm({ mode, initialData, onSubmit }: DiscountFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [code, setCode] = useState(initialData?.code ?? "");
  const [type, setType] = useState<DiscountType>((initialData?.type as DiscountType) ?? "PERCENTAGE");
  const [value, setValue] = useState(initialData?.value != null ? String(initialData.value) : "");
  const [minOrderAmountZAR, setMinOrderAmountZAR] = useState(
    initialData?.minOrderAmountZAR != null ? String(initialData.minOrderAmountZAR) : "0"
  );
  const [maxUsageCount, setMaxUsageCount] = useState(
    initialData?.maxUsageCount != null ? String(initialData.maxUsageCount) : ""
  );
  const [perUserLimit, setPerUserLimit] = useState(
    initialData?.perUserLimit != null ? String(initialData.perUserLimit) : ""
  );
  const [maxDiscountAmountZAR, setMaxDiscountAmountZAR] = useState(
    initialData?.maxDiscountAmountZAR != null ? String(initialData.maxDiscountAmountZAR) : ""
  );
  const [stackable, setStackable] = useState(initialData?.stackable ?? false);
  const [startDate, setStartDate] = useState(toDateInputValue(initialData?.startDate));
  const [endDate, setEndDate] = useState(toDateInputValue(initialData?.endDate));
  const [applicableProductIds, setApplicableProductIds] = useState(
    initialData?.applicableProductIds?.join(", ") ?? ""
  );

  // Validation & submission state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  // ─── Validation ───────────────────────────────────────────

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};

    if (!code.trim()) {
      errs.code = "Code is required.";
    }

    const numValue = Number(value);
    if (type === "PERCENTAGE") {
      if (!value || isNaN(numValue) || numValue < 1 || numValue > 100) {
        errs.value = "Percentage must be between 1 and 100.";
      }
    } else if (type === "FIXED_AMOUNT") {
      if (!value || isNaN(numValue) || numValue <= 0) {
        errs.value = "Amount must be a positive number.";
      }
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        errs.endDate = "End date must be after start date.";
      }
    }

    return errs;
  }

  // ─── Generate Code ────────────────────────────────────────

  function handleGenerateCode() {
    setCode(generatePromoCode());
    setErrors((prev) => {
      const next = { ...prev };
      delete next.code;
      return next;
    });
  }

  // ─── Submit ───────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    const numValue = Number(value);
    const productIds = applicableProductIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const formData: DiscountFormData = {
      code: code.trim(),
      type,
      value: numValue,
      minOrderAmountZAR: Number(minOrderAmountZAR) || 0,
      maxUsageCount: maxUsageCount ? Number(maxUsageCount) : null,
      perUserLimit: perUserLimit ? Number(perUserLimit) : null,
      maxDiscountAmountZAR: maxDiscountAmountZAR ? Number(maxDiscountAmountZAR) : null,
      stackable,
      startDate: startDate || null,
      endDate: endDate || null,
      applicableProductIds: productIds,
    };

    startTransition(async () => {
      const result = await onSubmit(formData);
      if (result && "error" in result && result.error) {
        setSubmitError(result.error);
        return;
      }
      router.push("/admin/discounts");
    });
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* ── Section: Code & Type ─────────────────────────────── */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Code Details</h2>

        <div className="space-y-1">
          <label htmlFor="code" className="block text-sm font-medium text-foreground">Code</label>
          <div className="flex gap-2">
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SUMMER20"
              className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
            />
            <button
              type="button"
              onClick={handleGenerateCode}
              className="px-3 py-2 text-xs font-medium rounded-md border border-border text-foreground hover:bg-surface-muted transition-colors whitespace-nowrap"
            >
              Generate Code
            </button>
          </div>
          {errors.code && <p className="text-xs text-red-400">{errors.code}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="type" className="block text-sm font-medium text-foreground">Discount Type</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as DiscountType)}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
            >
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED_AMOUNT">Fixed Amount (ZAR cents)</option>
              <option value="FREE_SHIPPING">Free Shipping</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="value" className="block text-sm font-medium text-foreground">
              {type === "PERCENTAGE" ? "Percentage (1-100)" : type === "FIXED_AMOUNT" ? "Amount (ZAR cents)" : "Value"}
            </label>
            <input
              id="value"
              type="number"
              min={type === "PERCENTAGE" ? "1" : "1"}
              max={type === "PERCENTAGE" ? "100" : undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={type === "FREE_SHIPPING"}
              placeholder={type === "FREE_SHIPPING" ? "N/A" : ""}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors disabled:opacity-50"
            />
            {errors.value && <p className="text-xs text-red-400">{errors.value}</p>}
          </div>
        </div>

        {type === "PERCENTAGE" && (
          <div className="space-y-1">
            <label htmlFor="maxDiscountAmountZAR" className="block text-sm font-medium text-foreground">
              Max Discount Cap (ZAR cents)
            </label>
            <input
              id="maxDiscountAmountZAR"
              type="number"
              min="0"
              value={maxDiscountAmountZAR}
              onChange={(e) => setMaxDiscountAmountZAR(e.target.value)}
              placeholder="Leave empty for no cap"
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
            />
            <p className="text-xs text-muted">Optional. Caps the maximum discount amount for percentage codes.</p>
          </div>
        )}
      </div>

      {/* ── Section: Conditions ───────────────────────────────── */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Conditions</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="minOrderAmountZAR" className="block text-sm font-medium text-foreground">
              Min Order Amount (ZAR cents)
            </label>
            <input
              id="minOrderAmountZAR"
              type="number"
              min="0"
              value={minOrderAmountZAR}
              onChange={(e) => setMinOrderAmountZAR(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
            />
            <p className="text-xs text-muted">0 = no minimum order required.</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="maxUsageCount" className="block text-sm font-medium text-foreground">
              Max Usage Count
            </label>
            <input
              id="maxUsageCount"
              type="number"
              min="1"
              value={maxUsageCount}
              onChange={(e) => setMaxUsageCount(e.target.value)}
              placeholder="Unlimited"
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
            />
            <p className="text-xs text-muted">Leave empty for unlimited usage.</p>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="perUserLimit" className="block text-sm font-medium text-foreground">
            Per-User Limit
          </label>
          <input
            id="perUserLimit"
            type="number"
            min="1"
            value={perUserLimit}
            onChange={(e) => setPerUserLimit(e.target.value)}
            placeholder="Unlimited"
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
          />
          <p className="text-xs text-muted">Leave empty for unlimited per-user usage.</p>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="stackable" className="text-sm font-medium text-foreground">Stackable</label>
          <button
            id="stackable"
            type="button"
            role="switch"
            aria-checked={stackable}
            onClick={() => setStackable(!stackable)}
            className={[
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              stackable ? "bg-theme-accent" : "bg-border",
            ].join(" ")}
          >
            <span
              className={[
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                stackable ? "translate-x-6" : "translate-x-1",
              ].join(" ")}
            />
          </button>
          <span className="text-xs text-muted">Allow combining with other codes.</span>
        </div>
      </div>

      {/* ── Section: Schedule ─────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Schedule</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="startDate" className="block text-sm font-medium text-foreground">Start Date</label>
            <input
              id="startDate"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
            />
            <p className="text-xs text-muted">Leave empty for immediate activation.</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="endDate" className="block text-sm font-medium text-foreground">End Date</label>
            <input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
            />
            {errors.endDate && <p className="text-xs text-red-400">{errors.endDate}</p>}
            <p className="text-xs text-muted">Leave empty for no expiration.</p>
          </div>
        </div>
      </div>

      {/* ── Section: Product Restrictions ─────────────────────── */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Product Restrictions</h2>

        <div className="space-y-1">
          <label htmlFor="applicableProductIds" className="block text-sm font-medium text-foreground">
            Applicable Product IDs
          </label>
          <input
            id="applicableProductIds"
            type="text"
            value={applicableProductIds}
            onChange={(e) => setApplicableProductIds(e.target.value)}
            placeholder="Leave empty for all products"
            className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-foreground focus:border-theme-accent transition-colors"
          />
          <p className="text-xs text-muted">Comma-separated product IDs. Leave empty to apply to all products.</p>
        </div>
      </div>

      {/* ── Submit ─────────────────────────────────────────────── */}
      {submitError && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{submitError}</p>
        </div>
      )}

      <div className="flex items-center gap-3 pb-8">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 text-sm font-medium rounded-md bg-theme-accent text-theme-bg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? (mode === "create" ? "Creating…" : "Saving…")
            : (mode === "create" ? "Create Discount" : "Save Changes")}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/discounts")}
          className="px-6 py-2.5 text-sm rounded-md border border-border text-foreground hover:bg-surface-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
