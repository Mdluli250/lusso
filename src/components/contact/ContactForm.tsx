"use client";

import { useState } from "react";
import { CONTACT_TOPICS } from "@/lib/constants/brand";
import type { ContactFormData } from "@/lib/constants/brand";
import { submitContactForm } from "@/actions/contact";

/**
 * ContactForm — client component for the Contact page.
 *
 * Provides name, email, topic, and message fields with client-side validation,
 * inline error messages, ARIA labels, and success/error state display.
 *
 * Requirements: 13.1, 13.2, 13.3, 13.4, 16.8
 */

interface FormErrors {
  name?: string;
  email?: string;
  topic?: string;
  message?: string;
}

type SubmitStatus = "idle" | "success" | "error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(data: ContactFormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = "Name is required";
  } else if (data.name.length > 100) {
    errors.name = "Name must be 100 characters or fewer";
  }

  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (data.email.length > 254) {
    errors.email = "Email must be 254 characters or fewer";
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!data.topic) {
    errors.topic = "Please select a topic";
  }

  if (!data.message.trim()) {
    errors.message = "Message is required";
  } else if (data.message.length > 2000) {
    errors.message = "Message must be 2000 characters or fewer";
  }

  return errors;
}

export function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    topic: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitStatus("idle");

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    try {
      const result = await submitContactForm(formData);
      if (result.success) {
        setSubmitStatus("success");
      } else {
        setSubmitStatus("error");
      }
    } catch {
      setSubmitStatus("error");
    }
  }

  if (submitStatus === "success") {
    return (
      <div
        className="rounded-lg bg-cream border border-taupe p-8 text-center"
        role="status"
        aria-live="polite"
      >
        <h3 className="font-serif text-2xl text-charcoal mb-2">Message Sent</h3>
        <p className="text-warm-grey text-base">
          Thank you for reaching out. We&apos;ll get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6"
      aria-label="Contact form"
    >
      {submitStatus === "error" && (
        <div
          className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 text-sm"
          role="alert"
          aria-live="assertive"
        >
          Unable to send message. Please try again.
        </div>
      )}

      {/* Name field */}
      <div>
        <label
          htmlFor="contact-name"
          className="block text-sm font-medium text-charcoal mb-1"
        >
          Name
        </label>
        <input
          type="text"
          id="contact-name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          maxLength={100}
          required
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
          className="w-full rounded-md border border-taupe bg-white px-4 py-3 text-base text-charcoal placeholder:text-warm-grey focus:outline-none focus:ring-2 focus:ring-charcoal focus:ring-offset-1"
          placeholder="Your name"
        />
        {errors.name && (
          <p
            id="contact-name-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {errors.name}
          </p>
        )}
      </div>

      {/* Email field */}
      <div>
        <label
          htmlFor="contact-email"
          className="block text-sm font-medium text-charcoal mb-1"
        >
          Email
        </label>
        <input
          type="email"
          id="contact-email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          maxLength={254}
          required
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          className="w-full rounded-md border border-taupe bg-white px-4 py-3 text-base text-charcoal placeholder:text-warm-grey focus:outline-none focus:ring-2 focus:ring-charcoal focus:ring-offset-1"
          placeholder="you@example.com"
        />
        {errors.email && (
          <p
            id="contact-email-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {errors.email}
          </p>
        )}
      </div>

      {/* Topic field */}
      <div>
        <label
          htmlFor="contact-topic"
          className="block text-sm font-medium text-charcoal mb-1"
        >
          Topic
        </label>
        <select
          id="contact-topic"
          name="topic"
          value={formData.topic}
          onChange={handleChange}
          required
          aria-required="true"
          aria-invalid={!!errors.topic}
          aria-describedby={errors.topic ? "contact-topic-error" : undefined}
          className="w-full rounded-md border border-taupe bg-white px-4 py-3 text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-charcoal focus:ring-offset-1"
        >
          <option value="">Select a topic</option>
          {CONTACT_TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
        {errors.topic && (
          <p
            id="contact-topic-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {errors.topic}
          </p>
        )}
      </div>

      {/* Message field */}
      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-charcoal mb-1"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          maxLength={2000}
          required
          rows={5}
          aria-required="true"
          aria-invalid={!!errors.message}
          aria-describedby={
            errors.message ? "contact-message-error" : undefined
          }
          className="w-full rounded-md border border-taupe bg-white px-4 py-3 text-base text-charcoal placeholder:text-warm-grey focus:outline-none focus:ring-2 focus:ring-charcoal focus:ring-offset-1 resize-y"
          placeholder="How can we help?"
        />
        {errors.message && (
          <p
            id="contact-message-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {errors.message}
          </p>
        )}
      </div>

      {/* Submit button — min 44px height, min 120px width */}
      <div>
        <button
          type="submit"
          className="min-h-[44px] min-w-[120px] rounded-md bg-charcoal px-6 py-3 text-base font-medium text-white transition-colors duration-150 hover:bg-warm-grey focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
        >
          Send Message
        </button>
      </div>
    </form>
  );
}
