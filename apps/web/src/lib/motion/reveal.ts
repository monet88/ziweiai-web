// GSAP entrance helpers for chart/detail surfaces (Phase 11 Ticket 2).
// Animate only transform + opacity; honor prefers-reduced-motion; always clean up.
import gsap from 'gsap';

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface RevealOptions {
  /** CSS selector inside root (default: [data-reveal]). */
  selector?: string;
  /** Stagger between sibling targets in seconds. */
  stagger?: number;
  /** Duration of each item reveal. */
  duration?: number;
  /** Vertical travel distance in px before settle. */
  y?: number;
}

/**
 * Stagger-fade/slide children into view. Returns a cleanup that reverts GSAP state.
 * No-op when reduced motion is requested or no targets exist.
 */
export function revealElements(root: HTMLElement, options: RevealOptions = {}): () => void {
  const selector = options.selector ?? '[data-reveal]';
  const targets = root.querySelectorAll<HTMLElement>(selector);

  if (targets.length === 0 || prefersReducedMotion()) {
    // Ensure content is visible even if CSS left opacity:0 before JS ran.
    targets.forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return () => {};
  }

  const ctx = gsap.context(() => {
    gsap.fromTo(
      targets,
      { opacity: 0, y: options.y ?? 18 },
      {
        opacity: 1,
        y: 0,
        duration: options.duration ?? 0.55,
        stagger: options.stagger ?? 0.07,
        ease: 'power2.out',
        clearProps: 'transform',
      },
    );
  }, root);

  return () => ctx.revert();
}

/**
 * Hexagram/line micro-animation: draw-in each line row left-to-right via scaleX.
 * Targets elements marked [data-reveal-line].
 */
export function revealHexagramLines(root: HTMLElement): () => void {
  const lines = root.querySelectorAll<HTMLElement>('[data-reveal-line]');
  if (lines.length === 0 || prefersReducedMotion()) {
    lines.forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return () => {};
  }

  const ctx = gsap.context(() => {
    gsap.fromTo(
      lines,
      { opacity: 0, scaleX: 0.35, transformOrigin: 'left center' },
      {
        opacity: 1,
        scaleX: 1,
        duration: 0.42,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'transform',
      },
    );
  }, root);

  return () => ctx.revert();
}
