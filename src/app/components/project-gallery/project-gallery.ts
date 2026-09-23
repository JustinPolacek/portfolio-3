import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Project } from '../project-card/project-card';

/** A card's media cell — either a still or a looping clip. */
interface Media {
  src: string;
  video: boolean;
  /**
   * CSS aspect-ratio for the cell, so it takes the shape of whatever it holds.
   * A portrait clip gets a portrait cell and a landscape still a landscape one,
   * which lets each fill its container edge to edge without being cropped.
   */
  ratio: string;
}

/** One gallery entry: a project, rendered as a two-column card. */
interface Slide {
  project: Project;
  /** The single media cell; null when the project has no clip or image yet. */
  feature: Media | null;
}

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-project-gallery',
  templateUrl: './project-gallery.html',
})
export class ProjectGallery implements AfterViewInit, OnDestroy {
  readonly projects = input.required<Project[]>();

  private readonly rootRef = viewChild<ElementRef<HTMLElement>>('root');
  private readonly tweens: gsap.core.Tween[] = [];

  /** Emitted when the viewer clicks through to a project's case study. */
  readonly openProject = output<Project>();

  /**
   * One card per project: its clip if it has one, otherwise its first image.
   * Projects with neither still get a card — the template shows a placeholder
   * in the media column rather than dropping the project entirely.
   */
  readonly slides = computed<Slide[]>(() =>
    this.projects().map((p) => {
      const feature: Media | null = p.featureVideo
        ? { src: p.featureVideo, video: true, ratio: p.mediaRatio ?? '574 / 1254' }
        : p.images?.[0]
          ? { src: p.images[0], video: false, ratio: p.mediaRatio ?? '4 / 3' }
          : null;

      return { project: p, feature };
    }),
  );

  readonly hasProjects = computed(() => this.slides().length > 0);

  ngAfterViewInit(): void {
    const root = this.rootRef()?.nativeElement;
    if (!root) return;

    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-card]'));

    // One shared trigger on the section, with the cards staggered against each
    // other, rather than a separate trigger per card: per-card triggers meant
    // that on a short page — where the whole gallery is already in view at
    // load — every card's own 'top 88%' line was already crossed at creation,
    // so they all fired in the same tick with no cascade at all.
    gsap.set(cards, { autoAlpha: 0, y: 64 });
    this.tweens.push(
      gsap.to(cards, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.15,
        // On a short page the gallery is already in view when this trigger is
        // created, so it fires immediately — this delay holds it back just
        // long enough for the hero's own reveal ("Justin Poláček" + intro) to
        // lead, rather than both playing over each other on load. Scrolled
        // into view later instead, the delay is negligible next to the time
        // spent scrolling down to it.
        delay: 0.5,
        scrollTrigger: { trigger: root, start: 'top 88%', once: true },
      }),
    );

    // The media's true size (video metadata, decoded image) can still be
    // settling after this first measurement, shifting the section's height and
    // therefore the trigger's start position — refresh once assets are ready so
    // the reveal doesn't fire against a stale layout.
    const media = root.querySelectorAll<HTMLImageElement | HTMLVideoElement>('img, video');
    media.forEach((el) => {
      const event = el instanceof HTMLVideoElement ? 'loadedmetadata' : 'load';
      el.addEventListener(event, () => ScrollTrigger.refresh(), { once: true });
    });

    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  ngOnDestroy(): void {
    this.tweens.forEach((t) => {
      t.scrollTrigger?.kill();
      t.kill();
    });
    this.tweens.length = 0;
  }
}
