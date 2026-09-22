import { AfterViewInit, Component, ElementRef, OnDestroy, signal, viewChild } from '@angular/core';
import gsap from 'gsap';

/**
 * Custom follower cursor: a small dot that tracks the pointer closely and a
 * larger ring that trails behind with smooth easing. The ring grows when
 * hovering interactive elements. Disabled on touch / no-hover devices.
 */
@Component({
  selector: 'app-custom-cursor',
  templateUrl: './custom-cursor.html',
})
export class CustomCursor implements AfterViewInit, OnDestroy {
  private readonly dotRef = viewChild<ElementRef<HTMLDivElement>>('dot');
  private readonly ringRef = viewChild<ElementRef<HTMLDivElement>>('ring');

  /** Only render on devices that actually have a hovering pointer. */
  protected readonly enabled = signal(this.hasHover());

  // Quick-setters created once for buttery-smooth, GC-free per-frame updates.
  private setDotX?: (v: number) => void;
  private setDotY?: (v: number) => void;
  private setRingX?: (v: number) => void;
  private setRingY?: (v: number) => void;

  private hasHover(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  ngAfterViewInit(): void {
    if (!this.enabled()) return;

    const dot = this.dotRef()?.nativeElement;
    const ring = this.ringRef()?.nativeElement;
    if (!dot || !ring) return;

    this.setDotX = gsap.quickSetter(dot, 'x', 'px') as (v: number) => void;
    this.setDotY = gsap.quickSetter(dot, 'y', 'px') as (v: number) => void;
    // The ring eases toward the pointer for a smooth trailing feel.
    this.setRingX = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3.out' });
    this.setRingY = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3.out' });

    window.addEventListener('mousemove', this.onMove);
    document.addEventListener('mouseover', this.onOver);
    document.addEventListener('mouseout', this.onOut);
  }

  ngOnDestroy(): void {
    window.removeEventListener('mousemove', this.onMove);
    document.removeEventListener('mouseover', this.onOver);
    document.removeEventListener('mouseout', this.onOut);
  }

  private readonly onMove = (e: MouseEvent): void => {
    this.setDotX?.(e.clientX);
    this.setDotY?.(e.clientY);
    this.setRingX?.(e.clientX);
    this.setRingY?.(e.clientY);
  };

  /** Grow the ring over interactive targets. */
  private readonly onOver = (e: MouseEvent): void => {
    if ((e.target as HTMLElement)?.closest('a, button, [role="button"], .cursor-play')) {
      this.scaleRing(1.8);
    }
  };

  private readonly onOut = (e: MouseEvent): void => {
    if ((e.target as HTMLElement)?.closest('a, button, [role="button"], .cursor-play')) {
      this.scaleRing(1);
    }
  };

  private scaleRing(scale: number): void {
    const ring = this.ringRef()?.nativeElement;
    if (ring) gsap.to(ring, { scale, duration: 0.3, ease: 'power3.out' });
  }
}
