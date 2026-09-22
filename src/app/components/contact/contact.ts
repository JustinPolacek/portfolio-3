import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-contact',
  templateUrl: './contact.html',
})
export class Contact implements OnInit, AfterViewInit, OnDestroy {
  readonly email = 'justinpolacek@gmail.com';
  readonly phone = '+ 1 951 000 0000';
  readonly linkedinUrl = 'https://www.linkedin.com/';

  protected readonly localTime = signal('');
  protected readonly meridiem = signal('');
  protected readonly copied = signal(false);

  private readonly rootRef = viewChild<ElementRef<HTMLElement>>('root');
  private timer?: ReturnType<typeof setInterval>;

  ngAfterViewInit(): void {
    const root = this.rootRef()?.nativeElement;
    if (!root) return;
    const items = root.querySelectorAll('[data-contact-item]');
    gsap.from(items, {
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
  }

  ngOnInit(): void {
    this.updateClock();
    this.timer = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private updateClock(): void {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const meridiem = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    this.localTime.set(`${hours.toString().padStart(2, '0')}:${minutes}`);
    this.meridiem.set(meridiem);
  }

  copyEmail(): void {
    navigator.clipboard?.writeText(this.email);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
