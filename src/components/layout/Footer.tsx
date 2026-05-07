/**
 * Site-wide footer.
 * Displays brand name and copyright notice (Requirement 11.1).
 * Inherits the active color theme via CSS variables.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className={[
        'mt-auto',
        'bg-[var(--theme-bg)] text-[var(--theme-accent)]',
        'border-t border-white/10',
        'transition-colors duration-[600ms]',
      ].join(' ')}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight opacity-90">
          {/* Flame icon */}
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.546 3.75 3.75 0 0 1 3.255 3.718Z"
              clipRule="evenodd"
            />
          </svg>
          <span>Lusso</span>
        </div>

        {/* Copyright */}
        <p className="text-xs opacity-50">
          &copy; {year} Lusso. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
