// Feature: lusso-candles-website, Property 1: Active navigation link matches current route
// **Validates: Requirements 1.3**

// @vitest-environment jsdom

import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock next/navigation
const mockPathname = vi.fn<() => string>();
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { src, alt, width, height, ...rest } = props;
    return null;
  },
}));

// Mock next/link to render a plain anchor
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => {
    const React = require('react');
    return React.createElement('a', { href, ...props }, children);
  },
}));

// Mock the CartIcon and ThemeToggle components
vi.mock('@/components/layout/CartIcon', () => ({
  default: () => null,
}));

vi.mock('@/components/layout/ThemeToggle', () => ({
  ThemeToggle: () => null,
}));

const VALID_ROUTES = ['/', '/about', '/collection', '/bundle', '/quiz', '/experiences', '/contact'] as const;

describe('Property 1: Active navigation link matches current route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('exactly one nav link has active style (aria-current="page") for any valid route', { timeout: 30000 }, async () => {
    const NavBar = (await import('@/components/layout/NavBar')).default;

    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_ROUTES),
        (route) => {
          mockPathname.mockReturnValue(route);

          const { container } = render(NavBar());

          // Get all navigation links in the desktop nav (the ul with role="list" that's visible on md+)
          const desktopNav = container.querySelector('ul[role="list"]');
          expect(desktopNav).not.toBeNull();

          const navLinks = desktopNav!.querySelectorAll('a');

          // Filter to only the 7 main nav links (exclude admin link)
          const mainNavLinks = Array.from(navLinks).filter((link) =>
            VALID_ROUTES.includes(link.getAttribute('href') as typeof VALID_ROUTES[number])
          );

          expect(mainNavLinks.length).toBe(7);

          // Exactly one link should have aria-current="page"
          const activeLinks = mainNavLinks.filter(
            (link) => link.getAttribute('aria-current') === 'page'
          );
          expect(activeLinks.length).toBe(1);

          // The active link's href should match the current route
          expect(activeLinks[0].getAttribute('href')).toBe(route);

          // All other links should NOT have aria-current="page"
          const inactiveLinks = mainNavLinks.filter(
            (link) => link.getAttribute('aria-current') !== 'page'
          );
          expect(inactiveLinks.length).toBe(6);

          // Active link should have opacity-100 and border-b-2 classes
          const activeClasses = activeLinks[0].className;
          expect(activeClasses).toContain('opacity-100');
          expect(activeClasses).toContain('border-b-2');

          // Inactive links should have opacity-70 class
          inactiveLinks.forEach((link) => {
            expect(link.className).toContain('opacity-70');
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
