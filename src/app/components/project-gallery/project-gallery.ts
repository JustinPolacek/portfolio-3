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

    // One trigger per card so each rises as it reaches the viewport, rather than
    // the whole stack firing together when the section's top clears the fold.
    root.querySelectorAll<HTMLElement>('[data-card]').forEach((card) => {
      this.tweens.push(
        gsap.fromTo(
          card,
          { autoAlpha: 0, y: 64 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 88%', once: true },
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
