'use server';

interface ContactSubmission {
  name: string;
  email: string;
  topic: string;
  message: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContactForm(
  data: ContactSubmission
): Promise<{ success: boolean; error?: string }> {
  try {
    const { name, email, topic, message } = data;

    // Validate name: required, non-empty
    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Name is required' };
    }

    // Validate email: required, valid format
    if (!email || email.trim().length === 0) {
      return { success: false, error: 'Email is required' };
    }

    if (!EMAIL_REGEX.test(email)) {
      return { success: false, error: 'Invalid email format' };
    }

    // Validate topic: required, non-empty
    if (!topic || topic.trim().length === 0) {
      return { success: false, error: 'Topic is required' };
    }

    // Validate message: required, max 2000 chars
    if (!message || message.trim().length === 0) {
      return { success: false, error: 'Message is required' };
    }

    if (message.length > 2000) {
      return { success: false, error: 'Message must be 2000 characters or less' };
    }

    return { success: true };
  } catch (error) {
    console.error('submitContactForm failed:', error);
    return { success: false, error: 'Failed to submit contact form' };
  }
}
