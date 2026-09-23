import { AfterViewInit, Component, OnDestroy, inject, signal } from '@angular/core';
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
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
