import { AfterViewInit, Component, OnDestroy, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollService } from './services/scroll.service';
import { Header } from './components/header/header';
import { Hero } from './components/hero/hero';
import { CurrentRole, type RoleEntry } from './components/current-role/current-role';
import { ProjectList } from './components/project-list/project-list';
import { DesignPanel } from './components/design-panel/design-panel';
import { Contact } from './components/contact/contact';
import { CustomCursor } from './components/custom-cursor/custom-cursor';
import { Project } from './components/project-card/project-card';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [
    RouterOutlet,
    Header,
    Hero,
    CurrentRole,
    ProjectList,
    DesignPanel,
    Contact,
    CustomCursor,
  ],
})
export class App implements AfterViewInit, OnDestroy {
  private readonly scrollService = inject(ScrollService);
  private lenis?: Lenis;
  private readonly tickerUpdate = (time: number) => this.lenis?.raf(time * 1000);
  private readonly onWindowLoad = () => ScrollTrigger.refresh();

  constructor() {
    // Angular fires ngAfterViewInit bottom-up: every child component (hero,
    // current-role, contact, ...) runs its own ngAfterViewInit — and creates
    // its ScrollTriggers — before this root component's would. Registering
    // the plugin and standing up Lenis here instead, ahead of child view
    // init, means those child ScrollTriggers are created against an already
    // Lenis-synced scroll rather than racing it.
    gsap.registerPlugin(ScrollTrigger);

    this.lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    this.scrollService.register(this.lenis);

    // Keep ScrollTrigger in sync with Lenis-driven scroll.
    this.lenis.on('scroll', ScrollTrigger.update);

    // Drive Lenis from GSAP's ticker (single RAF loop, no lag).
    gsap.ticker.add(this.tickerUpdate);
    gsap.ticker.lagSmoothing(0);

    // Route in-page anchor clicks through Lenis for smooth scrolling.
    document.addEventListener('click', this.onAnchorClick);
  }

  ngAfterViewInit(): void {
    // Runs after every child's own ngAfterViewInit (view init fires bottom-up),
    // so every section's ScrollTrigger has already been created by this point.
    // A couple of them (current-role, contact) never call refresh() themselves
    // after creating theirs, so on a hard refresh their trigger start positions
    // can get measured before layout has fully settled — on a page tall enough
    // that those sections start already past their 'top 80%' line, the
    // animation is skipped rather than played. One refresh here, once layout
    // has had a beat to settle, re-measures every trigger site page-wide.
    requestAnimationFrame(() => ScrollTrigger.refresh());

    // Images, videos and web fonts can keep shifting layout after that first
    // pass, so refresh again once the window reports everything loaded.
    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        this.onWindowLoad();
      } else {
        window.addEventListener('load', this.onWindowLoad);
      }
    }
  }

  ngOnDestroy(): void {
    gsap.ticker.remove(this.tickerUpdate);
    document.removeEventListener('click', this.onAnchorClick);
    window.removeEventListener('load', this.onWindowLoad);
    this.lenis?.destroy();
  }

  private readonly onAnchorClick = (event: MouseEvent): void => {
    const anchor = (event.target as HTMLElement)?.closest('a[href^="#"]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || href === '#') {
      // Bare "#" — scroll to top.
      event.preventDefault();
      this.lenis?.scrollTo(0);
      return;
    }
    const target = document.querySelector(href);
    if (target) {
      event.preventDefault();
      this.lenis?.scrollTo(target as HTMLElement, { offset: -100 });
    }
  };

  readonly roles: RoleEntry[] = [
    {
      role: 'Founding Designer / UI Engineer',
      company: 'Rollnat1',
      dates: '2025 - Present',
      companyUrl: 'https://rollnat1.com/',
      video: 'assets/project-card/images/hero-vid.mp4',
    },
    {
      role: 'UI/UX Designer',
      company: 'MSI Surfaces',
      dates: '2022 - Present',
      companyUrl: 'https://www.msisurfaces.com/',
    },
    {
      role: 'Freelance Website Designer',
      company: 'Just Develop',
      dates: '2020 - 2022',
      companyUrl: '#',
    },
    {
      role: 'Chocolatier',
      company: 'Polacek Chocolatier',
      dates: '2016 - 2020',
      companyUrl: 'https://www.youtube.com/@justinpolacek9797',
      youtubeUrl: 'https://www.youtube.com/@justinpolacek9797',
      formerly: true,
      video: 'assets/project-card/images/chocolate.mp4',
      videoWidth: '40rem',
      videoModalWidth: '24rem',
    },
  ];

  readonly projects: Project[] = [
    {
      title: 'ROLLNAT-1',
      headline: 'Fantasy RPG Platform',
      tags: ['Design System', 'Frontend', 'Branding'],
      description: 'Create rulebooks, entities, and campaigns for custom tabletop RPGs.',
      role: 'Founding Designer / UI Engineer',
      stack: 'Angular · TypeScript · Figma',
      focus: 'UX Flows · Components · Visual System',
      video: 'assets/project-card/images/hero-vid.mp4',
      featureVideo: 'assets/projects/rollnat-vid.mp4',
      mediaRatio: '574 / 1254',
      images: ['assets/projects/01.png', 'assets/projects/02.png', 'assets/projects/03.png'],
      url: 'https://rollnat1.com/',
      overview:
        'ROLLNAT-1 is a platform for building custom tabletop RPGs — rulebooks, entities and campaigns in one place. I joined as founding designer and built the visual system and front end alongside the product itself.',
      goals: [
        'Give game masters a single place to author rules, entities and campaigns.',
        'Establish a design system that scales as new game mechanics are added.',
        'Keep dense rule content readable without losing the fantasy character.',
      ],
      structureSummary:
        'The app is organised around three primitives — rulebooks, entities and campaigns — that reference each other, so a rule written once can be reused anywhere it applies.',
      visualSummary:
        'A dark, high-contrast interface that keeps long rule text legible, with restrained motion used to signal state rather than decorate.',
      visualVideo: 'assets/projects/rollnat-vid.mp4',
    },
    {
      title: 'MSI SURFACES',
      headline: 'Interactive Product Prototypes',
      tags: ['Prototyping', 'UX Research', 'UI Design'],
      description:
        'Designing interactive prototypes for MSI Surfaces product experiences, from concept exploration to high-fidelity flows.',
      role: 'UI/UX Prototyping Engineer',
      stack: 'Figma · Framer · React',
      focus: 'Prototyping · UX Research · UI Design',
      images: [],
      url: 'https://www.msisurfaces.com/',
    },
    {
      title: 'POLACEK CHOCOLATIER',
      headline: 'Artisan Chocolate',
      tags: ['Photography', 'Branding', 'Product'],
      description: 'Handcrafted chocolates and confections, from recipe to plated presentation.',
      role: 'Chocolatier',
      stack: 'Photography · Styling',
      focus: 'Product · Styling · Branding',
      images: ['assets/projects/04.png', 'assets/projects/06.jpg', 'assets/projects/05.png'],
      mediaRatio: '1322 / 1190',
      url: 'https://www.youtube.com/@justinpolacek9797',
    },
  ];

  readonly activeProject = signal<Project | null>(null);

  openPanel(project: Project): void {
    this.activeProject.set(project);
  }

  closePanel(): void {
    this.activeProject.set(null);
  }
}
