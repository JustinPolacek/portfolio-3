import { AfterViewInit, Component, ElementRef, input, output, viewChild } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ProjectCardMedia } from './project-card-media/project-card-media';
import { ProjectCardActions } from './project-card-actions/project-card-actions';

gsap.registerPlugin(ScrollTrigger);

export interface Project {
  title: string;
  headline: string;
  tags: string[];
  description: string;
  role: string;
  stack: string;
  focus: string;
  images: string[];
  video?: string;
  /** Plays in the gallery bento's large cell, in place of the first image. */
  featureVideo?: string;
  /**
   * Aspect ratio for the gallery card's media cell, as a CSS `aspect-ratio`
   * value (e.g. '16 / 9'). Set it when the media is not the assumed shape, so
   * the cell matches it and nothing is cropped.
   */
  mediaRatio?: string;
  /**
   * Clips for the gallery bento's two stacked cells, by slot: index 0 replaces
   * the upper cell, index 1 the lower. Leave a slot undefined to keep its image.
   *
   * A bare string is fitted whole inside the cell — the right default for UI
   * captures, which crop badly. Pass `{ src, fill: true }` for footage that
   * should cover the cell edge to edge instead.
   */
  stackedVideos?: (string | { src: string; fill?: boolean } | undefined)[];
  url?: string;

  // --- Case study content (design panel) ---

  /** Large image beneath the case-study hero. Defaults to the first image. */
  heroImage?: string;
  /** Longer overview for the case study; falls back to `description`. */
  overview?: string;
  /** Bulleted goals for the project. */
  goals?: string[];
  /** Diagram illustrating how the app is organised. */
  structureImage?: string;
  /** Prose accompanying the structure diagram. */
  structureSummary?: string;
  /** Prose introducing the visual design section. */
  visualSummary?: string;
  /** Screen capture of the app in use, shown in the visual design section. */
  visualVideo?: string;
  /**
   * Feature walkthrough sections, rendered in order after Visual Design. Each
   * is a heading plus prose, with an optional image or clip.
   */
  features?: ProjectFeature[];
}

/** One feature section of a case study (Entities, Publishing, and so on). */
export interface ProjectFeature {
  title: string;
  body: string;
  /** Still shown beneath the prose. */
  image?: string;
  /** Looping clip shown beneath the prose; takes precedence over `image`. */
  video?: string;
}

@Component({
  selector: 'app-project-card',
  templateUrl: './project-card.html',
  imports: [ProjectCardMedia, ProjectCardActions],
})
export class ProjectCard implements AfterViewInit {
  readonly project = input.required<Project>();
  readonly openDesignPanel = output<Project>();

  private readonly cardRef = viewChild<ElementRef<HTMLDivElement>>('card');

  ngAfterViewInit(): void {
    const el = this.cardRef()?.nativeElement;
    if (!el) return;
    gsap.from(el, {
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: 'power3.out',
      clearProps: 'opacity,transform',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });
  }
}
