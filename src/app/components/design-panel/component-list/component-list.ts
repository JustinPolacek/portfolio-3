import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  input,
  viewChild,
} from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * One component in the gallery. `src` is the single-image shorthand; `srcs`
 * carries a set of variants (default, hover, disabled…) shown side by side.
 */
export interface ComponentItem {
  label: string;
  src?: string;
  srcs?: string[];
}

/** A component paired with the image set actually rendered for it. */
interface Gallery {
  label: string;
  images: string[];
}

@Component({
  selector: 'app-component-list',
  templateUrl: './component-list.html',
})
export class ComponentList implements AfterViewInit, OnDestroy {
  /** Components to display; each contributes one labelled row of previews. */
  readonly items = input<ComponentItem[]>([]);

  private readonly rootRef = viewChild<ElementRef<HTMLElement>>('root');

  private readonly tweens: gsap.core.Tween[] = [];

  /**
   * Normalise each item to a list of images, so the template does not care
   * whether a component supplied one `src` or a set of `srcs`.
   */
  readonly galleries = computed<Gallery[]>(() =>
    this.items().map((item) => ({
      label: item.label,
      images: item.srcs?.length ? item.srcs : item.src ? [item.src] : [],
    })),
  );

  ngAfterViewInit(): void {
    const root = this.rootRef()?.nativeElement;
    if (!root) return;

    // The panel scrolls its own overflow container, so positions must resolve
    // against that scroller rather than the viewport.
    const scroller = root.closest<HTMLElement>('[data-lenis-prevent]') ?? undefined;

    // One trigger per component, so each row sweeps in as it arrives rather than
    // all of them firing at once. `once` leaves them static afterwards.
    root.querySelectorAll<HTMLElement>('[data-gallery]').forEach((gallery) => {
      const label = gallery.querySelector<HTMLElement>('[data-title]');
      const shots = gallery.querySelectorAll<HTMLElement>('[data-shot]');
      const trigger = { trigger: gallery, scroller, start: 'top 85%', once: true } as const;

      if (label) {
        this.tweens.push(
          gsap.fromTo(
            label,
            { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', scrollTrigger: trigger },
          ),
        );
      }

      // Each shot gets its OWN trigger rather than one for the whole row. On
      // mobile the shots are full-width and stacked, so a single row-level
      // trigger would fire them all while most were still far below the fold —
      // they would be revealed before the viewer ever reached them.
      shots.forEach((shot) => {
        this.tweens.push(
          gsap.fromTo(
            shot,
            { autoAlpha: 0, y: 32, scale: 0.96 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.9,
              ease: 'power2.out',
              scrollTrigger: { trigger: shot, scroller, start: 'top 88%', once: true },
            },
          ),
        );
      });
    });

    ScrollTrigger.refresh();
  }

  ngOnDestroy(): void {
    this.tweens.forEach((t) => {
      t.scrollTrigger?.kill();
      t.kill();
    });
    this.tweens.length = 0;
  }
}
