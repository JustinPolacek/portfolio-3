import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  input,
  signal,
  viewChild,
} from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MOBILE_BREAKPOINT = 768; // matches Tailwind `md`

export interface RoleEntry {
  role: string;
  company: string;
  /** Date range for the role, e.g. "2025 - Present". */
  dates?: string;
  companyUrl: string;
  /** Optional YouTube channel — shows a small icon link beside the arrow. */
  youtubeUrl?: string;
  formerly?: boolean;
  video?: string;
  /** Desktop hover-overlay width (CSS value). Defaults to 18rem. */
  videoWidth?: string;
  /** Mobile modal max-width (CSS value). Defaults to 20rem. */
  videoModalWidth?: string;
}

@Component({
  selector: 'app-current-role',
  templateUrl: './current-role.html',
})
export class CurrentRole implements AfterViewInit, OnDestroy {
  readonly roles = input<RoleEntry[]>([]);

  /** Source of the video to preview (kept set so it can animate out). */
  protected readonly hoverVideo = signal<string | null>(null);

  /** Width of the desktop hover overlay for the active video. */
  protected readonly hoverVideoWidth = signal('18rem');

  /** Max-width of the mobile centered modal for the active video. */
  protected readonly hoverVideoModalWidth = signal('20rem');

  /**
   * Use the inline tap-to-play layout when the viewport is narrow (matches `md`)
   * OR the device has no hover capability. Covers real phones and narrow windows.
   */
  protected readonly isMobile = signal(this.computeMobile());

  private computeMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT || window.matchMedia('(hover: none)').matches;
  }

  private readonly onResize = () => this.isMobile.set(this.computeMobile());

  /** Scroll-in reveal for the label and rows. */
  private reveal?: gsap.core.Tween;

  private readonly rootRef = viewChild<ElementRef<HTMLElement>>('root');
  private readonly overlayRef = viewChild<ElementRef<HTMLDivElement>>('overlay');
  private readonly listRef = viewChild<ElementRef<HTMLDivElement>>('list');
  private readonly labelRef = viewChild<ElementRef<HTMLParagraphElement>>('label');
  private readonly backdropRef = viewChild<ElementRef<HTMLDivElement>>('backdrop');

  private showBackdrop(): void {
    const el = this.backdropRef()?.nativeElement;
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.set(el, { visibility: 'visible' });
    gsap.to(el, { opacity: 1, duration: 0.4, ease: 'power2.out' });
  }

  private hideBackdrop(): void {
    const el = this.backdropRef()?.nativeElement;
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.to(el, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => gsap.set(el, { visibility: 'hidden' }),
    });
  }

  constructor() {
    // Animate the role rows in after the view has actually rendered. The rows
    // come from an @for over the `roles` input, so they aren't in the DOM at
    // ngAfterViewInit — a plain rAF there fired before they existed and animated
    // nothing. afterNextRender runs once the browser has painted, so the rows
    // are guaranteed present.
    afterNextRender(() => {
      const root = this.rootRef()?.nativeElement;
      const list = this.listRef()?.nativeElement;
      const rows = list?.querySelectorAll<HTMLElement>('[data-role-row]');
      const label = this.labelRef()?.nativeElement;
      // Animate the "Work experience" label first, then the rows — one cascade.
      const targets = [label, ...(rows ? Array.from(rows) : [])].filter(
        (el): el is HTMLElement => !!el,
      );
      if (!root || !targets.length) return;

      // Scroll-triggered, matching the contact section: this section now sits
      // below the projects, so a load-time delay would have played it out long
      // before the viewer ever scrolled down to it.
      this.reveal = gsap.from(targets, {
        opacity: 0,
        y: 24,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.1,
        clearProps: 'opacity,transform',
        scrollTrigger: {
          trigger: root,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });
    });
  }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onResize);
    }

    // Prime the overlay so it's hidden but ready to animate.
    const overlay = this.overlayRef()?.nativeElement;
    if (overlay) gsap.set(overlay, { opacity: 0, scale: 0.92, y: 10 });
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResize);
    }
    this.reveal?.scrollTrigger?.kill();
    this.reveal?.kill();
  }

  showVideo(entry?: RoleEntry): void {
    if (this.isMobile() || !entry?.video) return;
    this.openOverlay(entry);
  }

  /** Click handler for the play button — centered modal on mobile, overlay on desktop. */
  toggleVideo(event: Event, entry?: RoleEntry): void {
    event.preventDefault();
    event.stopPropagation();
    if (!entry?.video) return;

    if (this.hoverVideo() === entry.video) {
      this.hideVideo();
      return;
    }

    if (!this.isMobile()) {
      this.openOverlay(entry);
      return;
    }

    // Mobile: open the centered modal (CSS handles the fade/scale via .modal-anim).
    this.hoverVideoModalWidth.set(entry.videoModalWidth ?? '20rem');
    this.hoverVideo.set(entry.video);
    this.showBackdrop();
  }

  private openOverlay(entry: RoleEntry): void {
    this.hoverVideo.set(entry.video!);
    this.hoverVideoWidth.set(entry.videoWidth ?? '18rem');
    this.showBackdrop();
    const overlay = this.overlayRef()?.nativeElement;
    if (overlay) {
      gsap.killTweensOf(overlay);
      gsap.to(overlay, { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power3.out' });
    }
  }

  hideVideo(): void {
    if (this.isMobile()) {
      this.hideBackdrop();
      this.hoverVideo.set(null);
      return;
    }
    this.hideBackdrop();
    const overlay = this.overlayRef()?.nativeElement;
    if (overlay) {
      gsap.killTweensOf(overlay);
      gsap.to(overlay, {
        opacity: 0,
        scale: 0.92,
        y: 10,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => this.hoverVideo.set(null),
      });
    } else {
      this.hoverVideo.set(null);
    }
  }
}
