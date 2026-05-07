/**
 * Button — reusable button component with variant, size, and disabled state.
 *
 * Variants:
 *   - primary:   filled with theme-accent background
 *   - secondary: outlined with theme-accent border
 *   - ghost:     transparent with hover background
 *
 * All variants include a visible focus ring via :focus-visible (defined in
 * globals.css) to satisfy WCAG 2.1 AA keyboard navigation (Req 11.7).
 *
 * Requirements: 5.6, 11.7
 */

import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders a full-width block button */
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-theme-accent text-white',
    'hover:opacity-90 active:opacity-80',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    'border border-transparent',
  ].join(' '),

  secondary: [
    'bg-transparent text-theme-accent',
    'border border-theme-accent',
    'hover:bg-theme-accent/10 active:bg-theme-accent/20',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),

  ghost: [
    'bg-transparent text-foreground',
    'border border-transparent',
    'hover:bg-surface-muted active:bg-surface',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-5 py-2.5 text-base rounded-lg',
  lg: 'px-7 py-3.5 text-lg rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        aria-disabled={disabled}
        className={[
          // Base styles
          'inline-flex items-center justify-center gap-2',
          'font-medium leading-none',
          'transition-all duration-150',
          // Variant + size
          variantClasses[variant],
          sizeClasses[size],
          // Full width modifier
          fullWidth ? 'w-full' : '',
          // Caller overrides
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
