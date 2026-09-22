import { AfterViewInit, Component, ElementRef, viewChild } from '@angular/core';
import gsap from 'gsap';
import { ScrollText } from '../scroll-text/scroll-text';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  imports: [ScrollText],
})
export class Hero implements AfterViewInit {
  private readonly rootRef = viewChild<ElementRef<HTMLElement>>('root');

  ngAfterViewInit(): void {
    const root = this.rootRef()?.nativeElement;
    if (!root) return;
    const items = root.querySelectorAll<HTMLElement>('[data-hero-item]');

    // Set the start state immediately (no post-paint flash), then play on the
    // next frame so the entrance doesn't share the load frame with Lenis/
    // ScrollTrigger setup — that contention is what makes it stutter.
    gsap.set(items, { opacity: 0, y: 24, willChange: 'transform, opacity' });
    requestAnimationFrame(() => {
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.12,
        force3D: true,
        clearProps: 'willChange',
      });
    });
  }
}
