import { Injectable } from '@angular/core';
import type Lenis from 'lenis';

/**
 * Holds the app-wide Lenis instance so any component can request a smooth
 * scroll without depending on the root component directly.
 */
@Injectable({ providedIn: 'root' })
export class ScrollService {
  private lenis?: Lenis;

  register(lenis: Lenis): void {
    this.lenis = lenis;
  }

  /** Smoothly scroll a target element into view. */
  scrollTo(target: HTMLElement, options: { offset?: number } = {}): void {
    if (this.lenis) {
      this.lenis.scrollTo(target, { offset: options.offset ?? -120, duration: 0.9 });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}
