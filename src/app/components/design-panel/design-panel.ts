import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { Project, ProjectFeature } from '../project-card/project-card';
import { PanelHeader } from './panel-header/panel-header';
import { PanelFooter } from './panel-footer/panel-footer';
import { ColorSwatch } from './color-palette/color-palette';
import { ComponentList, ComponentItem } from './component-list/component-list';
import { ColorHoverList } from './color-hover-list/color-hover-list';
import { NpmHandoff } from './npm-handoff/npm-handoff';
import { ScrollText } from '../scroll-text/scroll-text';

@Component({
  selector: 'app-design-panel',
  templateUrl: './design-panel.html',
  imports: [
    PanelHeader,
    PanelFooter,
    ComponentList,
    ColorHoverList,
    NpmHandoff,
    ScrollText,
  ],
})
export class DesignPanel implements OnInit, OnDestroy {
  readonly project = input<Project | null>(null);
  readonly closePanel = output<void>();

  /** Case-study hero image, falling back to the project's first image. */
  readonly heroImage = computed(() => {
    const p = this.project();
    return p?.heroImage ?? p?.images?.[0] ?? null;
  });

  /** In-use footage for the visual design section; the feature clip by default. */
  readonly visualVideo = computed(() => {
    const p = this.project();
    return p?.visualVideo ?? p?.featureVideo ?? null;
  });

  /**
   * Feature walkthrough sections. Falls back to the four ROLLNAT-1 features so
   * the section is scaffolded; a project can override with its own.
   */
  readonly features = computed<ProjectFeature[]>(
    () =>
      this.project()?.features ?? [
        {
          title: 'Entities',
          body: 'Characters, creatures, items and locations are all entities — one model with a shared editor, so a game master learns the interface once and reuses it everywhere.',
        },
        {
          title: 'Properties',
          body: 'Every entity is described by properties the game master defines: stats, traits, costs, whatever the system needs. Properties are typed, so the app can validate and roll against them.',
        },
        {
          title: 'Rulebook Editor',
          body: 'A structured editor for writing rules that reference entities and properties directly, so a change to a stat propagates everywhere that stat is cited.',
        },
        {
          title: 'Publishing',
          body: 'Finished rulebooks are published as a playable, shareable reference — the same content the game master authored, laid out for the table.',
        },
      ],
  );

  /** Project goals, with a placeholder set so the section is never empty. */
  readonly goals = computed(
    () =>
      this.project()?.goals ?? [
        'Add a goal describing what the project set out to achieve.',
        'Add a second goal covering the experience or design intent.',
        'Add a third goal covering the technical or business outcome.',
      ],
  );

  private readonly panelRef = viewChild<ElementRef<HTMLDivElement>>('panel');
  private readonly scrollerRef = viewChild<ElementRef<HTMLDivElement>>('scroller');
  private readonly scrollContentRef = viewChild<ElementRef<HTMLDivElement>>('scrollContent');

  /** Smooth scrolling for the case-study body (its own container, not the page). */
  private lenis?: Lenis;
  private readonly lenisRaf = (time: number) => this.lenis?.raf(time * 1000);

  /** Section entrance tweens, torn down whenever the panel closes. */
  private readonly reveals: gsap.core.Tween[] = [];

  /** True while our history entry is on the stack, so we push exactly one. */
  private historyPushed = false;
  /** Set when the browser already navigated, to avoid a second history.back(). */
  private closingFromPopstate = false;

  /**
   * Components gallery: each label is shown above a row of that component's
   * variants. Swap these placeholders for real captures of each state — the
   * component takes any number of images per entry.
   */
  readonly componentItems: ComponentItem[] = [
    {
      label: 'Button',
      srcs: ['assets/projects/01.png', 'assets/projects/02.png', 'assets/projects/03.png'],
    },
    { label: 'Card', srcs: ['assets/projects/02.png', 'assets/projects/04.png'] },
    {
      label: 'Tag',
      srcs: ['assets/projects/03.png', 'assets/projects/05.png', 'assets/projects/06.jpg'],
    },
    { label: 'Input', srcs: ['assets/projects/04.png', 'assets/projects/01.png'] },
    { label: 'Modal', srcs: ['assets/projects/05.png'] },
    { label: 'Navigation', srcs: ['assets/projects/06.jpg', 'assets/projects/02.png'] },
  ];

  readonly swatches: ColorSwatch[] = [
    { name: 'Primary', hex: '#0090ff' },
    { name: 'White', hex: '#ffffff' },
    { name: 'Dark', hex: '#121212' },
    { name: 'Gray', hex: '#4b5563' },
    { name: 'Light', hex: '#9ca3af' },
  ];

  constructor() {
    effect(() => {
      const project = this.project();
      const panel = this.panelRef()?.nativeElement;
      if (!panel) return;

      if (project) {
        // Fade only — no slide. autoAlpha also flips visibility, so the hidden
        // panel cannot swallow clicks meant for the page beneath it.
        gsap.to(panel, { autoAlpha: 1, duration: 0.7, ease: 'power2.out' });
        // Push a history entry so the browser's back button closes the panel
        // instead of leaving the site. Guarded: reopening from a popstate must
        // not push another entry, or back would need two presses.
        if (!this.historyPushed) {
          history.pushState({ designPanel: true }, '');
          this.historyPushed = true;
        }
        // Build Lenis only once the panel is open: it measures its container,
        // which is zero-height while the panel is hidden.
        this.initLenis();
      } else {
        gsap.to(panel, { autoAlpha: 0, duration: 0.3, ease: 'power2.in' });
        // Closing via the X button: drop the entry we added, so the back button
        // does not simply reopen what the viewer just dismissed.
        if (this.historyPushed && !this.closingFromPopstate) {
          history.back();
        }
        this.historyPushed = false;
        this.closingFromPopstate = false;
        this.destroyLenis();
      }
    });
  }

  ngOnInit(): void {
    const panel = this.panelRef()?.nativeElement;
    if (panel) gsap.set(panel, { autoAlpha: 0 });
    window.addEventListener('popstate', this.onPopState);
  }

  ngOnDestroy(): void {
    window.removeEventListener('popstate', this.onPopState);
    this.destroyLenis();
  }

  /**
   * Smooth-scroll the case-study body. This is a second Lenis instance, scoped
   * to the panel's own overflow container — the app's instance smooths the
   * window and cannot drive a nested scroller. `data-lenis-prevent` on that
   * container stops the page instance from stealing these wheel events.
   */
  private initLenis(): void {
    if (this.lenis) return;
    const wrapper = this.scrollerRef()?.nativeElement;
    const content = this.scrollContentRef()?.nativeElement;
    if (!wrapper || !content) return;

    this.lenis = new Lenis({
      wrapper,
      content,
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    // The scroll-driven sections read positions from this container, so every
    // smoothed frame has to refresh ScrollTrigger or they would lag behind.
    this.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(this.lenisRaf);

    // Lenis translates the content, so ScrollTrigger's cached bounds for this
    // scroller are stale until it re-measures.
    ScrollTrigger.refresh();

    this.buildReveals(wrapper);
  }

  /**
   * Fade-and-rise each section as it scrolls into view. Built after Lenis so the
   * triggers measure the smoothed container, and torn down with it.
   *
   * `once: true` — these are entrances, not scrubbed effects; replaying them on
   * every pass would fight the scroll-driven sections further down.
   */
  private buildReveals(scroller: HTMLElement): void {
    const targets = Array.from(scroller.querySelectorAll<HTMLElement>('[data-reveal]'));

    targets.forEach((el) => {
      const tween = gsap.fromTo(
        el,
        { autoAlpha: 0, y: 32 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            scroller,
            // Fires a little before the element is fully on screen, so it is
            // already settling by the time it reaches comfortable reading height.
            start: 'top 88%',
            once: true,
          },
        },
      );
      this.reveals.push(tween);
    });
  }

  private destroyLenis(): void {
    // Reveals are bound to the Lenis-scrolled container, so they die with it —
    // otherwise reopening the panel would stack a second set of triggers.
    this.reveals.forEach((t) => {
      t.scrollTrigger?.kill();
      t.kill();
    });
    this.reveals.length = 0;

    if (!this.lenis) return;
    gsap.ticker.remove(this.lenisRaf);
    this.lenis.destroy();
    this.lenis = undefined;
  }

  /** Browser back closes the panel, matching the X button. */
  private readonly onPopState = (): void => {
    if (!this.project()) return;
    // Flag it so the close handler doesn't call history.back() again — the
    // browser has already moved us; a second call would skip an extra entry.
    this.closingFromPopstate = true;
    this.closePanel.emit();
  };
}
