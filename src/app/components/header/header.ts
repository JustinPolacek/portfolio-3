import { AfterViewInit, Component, OnDestroy, inject, signal } from '@angular/core';
import gsap from 'gsap';
import { ThemeService } from '../../services/theme.service';

const SECTION_IDS = ['work', 'experience', 'contact'] as const;
type SectionId = (typeof SECTION_IDS)[number];

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
})
export class Header implements AfterViewInit, OnDestroy {
  protected readonly theme = inject(ThemeService);

  /** Which section the bottom nav's glass bubble should sit under. */
  protected readonly activeSection = signal<SectionId>('work');

  private observer?: IntersectionObserver;
  private tween?: gsap.core.Tween;

  ngAfterViewInit(): void {
    // Tracks whichever section currently covers the most of the viewport, so
    // the bubble follows scroll position rather than only explicit taps.
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );

    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          this.activeSection.set(visible.target.id as SectionId);
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    sections.forEach((section) => this.observer!.observe(section));

    // The nav pieces (logo, toggle, bottom pill / sidebar) fade and drop in
    // alongside the hero rather than just appearing — [data-nav-item] starts
    // hidden inline in the template so there's no flash before this runs.
    // The header's top-level pieces are fixed-position siblings rather than
    // children of one wrapper element, so this queries from the document
    // instead of a local root ref — safe since app-header is a page singleton.
    const items = document.querySelectorAll<HTMLElement>('[data-nav-item]');
    if (!items.length) return;

    gsap.set(items, { opacity: 0, y: -16, willChange: 'transform, opacity' });
    requestAnimationFrame(() => {
      this.tween = gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.08,
        force3D: true,
        clearProps: 'willChange',
      });
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.tween?.kill();
  }
}
