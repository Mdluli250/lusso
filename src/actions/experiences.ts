'use server';

interface InquirySubmission {
  name: string;
  email: string;
  message: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 1000;

export async function submitInquiry(
  data: InquirySubmission
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate name: required, non-empty
    if (!data.name || data.name.trim().length === 0) {
      return { success: false, error: 'Name is required.' };
    }

    // Validate email: required, valid format
    if (!data.email || data.email.trim().length === 0) {
      return { success: false, error: 'Email is required.' };
    }

    if (!EMAIL_REGEX.test(data.email.trim())) {
      return { success: false, error: 'Please provide a valid email address.' };
    }

    // Validate message: required, max 1000 chars
    if (!data.message || data.message.trim().length === 0) {
      return { success: false, error: 'Message is required.' };
    }

    if (data.message.length > MAX_MESSAGE_LENGTH) {
      return {
        success: false,
        error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
      };
    }

    // Submission is valid — no database write or email sending for now
    return { success: true };
  } catch (error) {
    console.error('Inquiry submission failed:', error);
    return {
      success: false,
      error: 'Unable to send inquiry. Please try again.',
    };
  }
}
