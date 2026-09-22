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
import { ColorSwatch } from '../color-palette/color-palette';

gsap.registerPlugin(ScrollTrigger);

/** Tonal stops shown for each colour, light to dark. */
const STOPS = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

/** Parse a #rgb or #rrggbb string into channel values. */
function parseHex(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/**
 * Mix `hex` toward white (stops below 500) or black (above), so one base colour
 * yields a coherent ramp. 500 returns the base untouched.
 */
function toneAt(hex: string, stop: number): string {
  const { r, g, b } = parseHex(hex);
  if (stop === 500) return hex;

  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const mix = (channel: number, target: number, amount: number) =>
    clamp(channel + (target - channel) * amount);

  if (stop < 500) {
    const t = ((500 - stop) / 500) * 0.95;
    return `rgb(${mix(r, 255, t)} ${mix(g, 255, t)} ${mix(b, 255, t)})`;
  }

  const t = ((stop - 500) / 450) * 0.88;
  return `rgb(${mix(r, 0, t)} ${mix(g, 0, t)} ${mix(b, 0, t)})`;
}

@Component({
  selector: 'app-color-hover-list',
  templateUrl: './color-hover-list.html',
})
export class ColorHoverList implements AfterViewInit, OnDestroy {
  readonly colors = input<ColorSwatch[]>([]);

  private readonly rootRef = viewChild<ElementRef<HTMLElement>>('root');

  private readonly tweens: gsap.core.Tween[] = [];

  /**
   * Each base colour expanded across the stops. 500 is the base itself; lighter
   * stops mix it toward white and darker ones toward black, so the ramp stays
   * on-hue rather than drifting.
   */
  readonly ramps = computed(() =>
    this.colors().map((swatch) => ({
      name: swatch.name,
      steps: STOPS.map((stop) => ({
        stop,
        hex: toneAt(swatch.hex, stop),
        onDark: stop >= 600,
      })),
    })),
  );

  ngAfterViewInit(): void {
    const root = this.rootRef()?.nativeElement;
    if (!root) return;

    // The panel scrolls its own overflow container, so positions must resolve
    // against that scroller rather than the viewport.
    const scroller = root.closest<HTMLElement>('[data-lenis-prevent]') ?? undefined;

    // One trigger per ramp, so each sweeps in as it arrives rather than all of
    // them firing together. `once` is what makes them static afterwards: the
    // swatches settle at full opacity and are never touched again.
    root.querySelectorAll<HTMLElement>('[data-ramp]').forEach((ramp) => {
      const steps = ramp.querySelectorAll<HTMLElement>('[data-step]');
      const label = ramp.querySelector<HTMLElement>('[data-title]');

      if (label) {
        this.tweens.push(
          gsap.fromTo(
            label,
            { autoAlpha: 0, y: 12 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.8,
              ease: 'power2.out',
              scrollTrigger: { trigger: ramp, scroller, start: 'top 85%', once: true },
            },
          ),
        );
      }

      this.tweens.push(
        gsap.fromTo(
          steps,
          { autoAlpha: 0, scale: 0.8, y: 10 },
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            duration: 0.9,
            ease: 'back.out(1.4)',
            // Left to right, so the ramp reads as filling from its light end.
            // A slower cadence lets the eye follow the sweep across the stops.
            stagger: { each: 0.08, from: 'start' },
            scrollTrigger: { trigger: ramp, scroller, start: 'top 85%', once: true },
          },
        ),
      );
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
