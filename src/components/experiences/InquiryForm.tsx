"use client";

import { useState } from "react";
import type { InquiryFormData } from "@/lib/constants/brand";
import { submitInquiry } from "@/actions/experiences";

/**
 * InquiryForm — client component for experience/event inquiries.
 *
 * Fields: name (required), email (required, validated format), message (required, max 1000 chars).
 * Client-side validation with inline error messages.
 * ARIA labels on all inputs with visible <label> elements.
 * Success/error state display after submission.
 *
 * Requirements: 12.3, 12.4, 12.5, 16.8
 */

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

type SubmissionStatus = "idle" | "success" | "error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MESSAGE_MAX_LENGTH = 1000;

export function InquiryForm() {
  const [formData, setFormData] = useState<InquiryFormData>({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmissionStatus>("idle");

  function validate(): FormErrors {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required.";
    } else if (formData.message.length > MESSAGE_MAX_LENGTH) {
      newErrors.message = `Message must be ${MESSAGE_MAX_LENGTH} characters or fewer.`;
    }

    return newErrors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("idle");

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      const result = await submitInquiry(formData);
      if (result.success) {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
        setErrors({});
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto max-w-xl space-y-6"
    >
      {/* Success message */}
      {status === "success" && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-green-300 bg-green-50 p-4 text-green-800 text-sm"
        >
          Thank you for your inquiry. We will be in touch soon.
        </div>
      )}

      {/* Error message */}
      {status === "error" && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 text-sm"
        >
          Unable to send your inquiry. Please try again.
        </div>
      )}

      {/* Name field */}
      <div>
        <label
          htmlFor="inquiry-name"
          className="block text-sm font-medium text-charcoal mb-1"
        >
          Name <span aria-hidden="true">*</span>
        </label>
        <input
          type="text"
          id="inquiry-name"
          name="name"
          required
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "inquiry-name-error" : undefined}
          value={formData.name}
          onChange={handleChange}
          className="w-full rounded-md border border-taupe bg-cream px-4 py-3 text-charcoal text-base placeholder:text-warm-grey focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal transition-colors duration-150"
          placeholder="Your full name"
        />
        {errors.name && (
          <p
            id="inquiry-name-error"
            role="alert"
            className="mt-1 text-sm text-red-700"
          >
            {errors.name}
          </p>
        )}
      </div>

      {/* Email field */}
      <div>
        <label
          htmlFor="inquiry-email"
          className="block text-sm font-medium text-charcoal mb-1"
        >
          Email <span aria-hidden="true">*</span>
        </label>
        <input
          type="email"
          id="inquiry-email"
          name="email"
          required
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "inquiry-email-error" : undefined}
          value={formData.email}
          onChange={handleChange}
          className="w-full rounded-md border border-taupe bg-cream px-4 py-3 text-charcoal text-base placeholder:text-warm-grey focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal transition-colors duration-150"
          placeholder="you@example.com"
        />
        {errors.email && (
          <p
            id="inquiry-email-error"
            role="alert"
            className="mt-1 text-sm text-red-700"
          >
            {errors.email}
          </p>
        )}
      </div>

      {/* Message field */}
      <div>
        <label
          htmlFor="inquiry-message"
          className="block text-sm font-medium text-charcoal mb-1"
        >
          Message <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="inquiry-message"
          name="message"
          required
          aria-required="true"
          aria-invalid={!!errors.message}
          aria-describedby={
            errors.message ? "inquiry-message-error" : undefined
          }
          value={formData.message}
          onChange={handleChange}
          maxLength={MESSAGE_MAX_LENGTH}
          rows={5}
          className="w-full rounded-md border border-taupe bg-cream px-4 py-3 text-charcoal text-base placeholder:text-warm-grey focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal transition-colors duration-150 resize-y"
          placeholder="Tell us about your event or experience inquiry..."
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.message ? (
            <p
              id="inquiry-message-error"
              role="alert"
              className="text-sm text-red-700"
            >
              {errors.message}
            </p>
          ) : (
            <span />
          )}
          <span
            className="text-xs text-warm-grey"
            aria-live="polite"
            aria-atomic="true"
          >
            {formData.message.length}/{MESSAGE_MAX_LENGTH}
          </span>
        </div>
      </div>

      {/* Submit button */}
      <div>
        <button
          type="submit"
          className="min-h-[44px] min-w-[120px] rounded-md bg-charcoal px-6 py-3 text-base font-medium text-white transition-colors duration-150 hover:bg-warm-grey focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
        >
          Send Inquiry
        </button>
      </div>
    </form>
  );
}
