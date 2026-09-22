import { AfterViewInit, Component, ElementRef, OnDestroy, input, viewChild } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

@Component({
  selector: 'app-scroll-text',
  templateUrl: './scroll-text.html',
})
export class ScrollText implements AfterViewInit, OnDestroy {
  /** The passage to reveal, one word at a time. */
  readonly text = input.required<string>();

  /**
   * Type styling for the copy. Defaults to the large statement treatment used by
   * the case studies; a card description passes something smaller.
   */
  readonly typeClass = input<string>(
    'text-xl sm:text-3xl font-medium tracking-tight leading-snug max-w-3xl',
  );

  /** Text colour, so a card can sit in secondary while a statement is primary. */
  readonly color = input<string>('var(--text-primary)');

  /**
   * Trailing space, which doubles as the reveal's scroll distance. A standalone
   * passage wants a lot; one inside a card wants almost none, since the card's
   * own height already carries it past the trigger.
   */
  readonly spacing = input<string>('pb-40');

  /**
   * Play the reveal once on load rather than scrubbing it to scroll. Content
   * above the fold has no scroll to drive it — it would simply render complete —
   * so it animates in on its own timeline instead.
   */
  readonly onLoad = input<boolean>(false);

  /**
   * Play the reveal straight through the first time it scrolls into view, rather
   * than scrubbing it to scroll position. The words still cascade, but the
   * passage is not tied to the wheel and never replays.
   */
  readonly once = input<boolean>(false);

  private readonly rootRef = viewChild<ElementRef<HTMLElement>>('root');
  private readonly copyRef = viewChild<ElementRef<HTMLElement>>('copy');

  private split?: SplitText;
  private tween?: gsap.core.Tween;

  ngAfterViewInit(): void {
    const root = this.rootRef()?.nativeElement;
    const copy = this.copyRef()?.nativeElement;
    if (!root || !copy) return;

    // Inside the design panel the copy sits in its own overflow container, so
    // positions must resolve against that scroller. On the main page there is no
    // such ancestor and `undefined` correctly falls back to the viewport.
    const scroller = root.closest<HTMLElement>('[data-lenis-prevent]') ?? undefined;

    // Split into lines AND words: the line wrappers keep each row's words
    // together so a word rising into place cannot reflow the text around it.
    this.split = new SplitText(copy, {
      type: 'lines,words',
      linesClass: 'line',
      wordsClass: 'word',
    });

    // Above the fold there is no scroll to scrub against, so the reveal plays on
    // its own timeline; everywhere else the words track scroll position and
    // reverse if the viewer scrolls back.
    if (this.onLoad()) {
      this.tween = gsap.fromTo(
        this.split.words,
        { opacity: 0.15 },
        { opacity: 1, ease: 'none', stagger: 0.06, duration: 0.5, delay: 0.3 },
      );
      return;
    }

    if (this.once()) {
      this.tween = gsap.fromTo(
        this.split.words,
        { opacity: 0.15 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.05,
          duration: 0.5,
          scrollTrigger: { trigger: copy, scroller, start: 'top 85%', once: true },
        },
      );
      return;
    }

    this.tween = gsap.fromTo(
      this.split.words,
      { opacity: 0.15 },
      {
        opacity: 1,
        ease: 'none',
        stagger: 0.4,
        scrollTrigger: {
          trigger: copy,
          scroller,
          // Start once the passage has risen into the comfortable reading band —
          // `top 65%` means nothing lights up while it is still low on screen.
          start: 'top 65%',
          // Finish while the text is STILL in view. Measured against the COPY,
          // not the padded root: the trailing padding exists to buy scroll
          // distance, so including it in the end position pushed completion past
          // the top of the screen.
          endTrigger: copy,
          end: 'bottom 70%',
          scrub: 0.6,
        },
      },
    );

    ScrollTrigger.refresh();
  }

  ngOnDestroy(): void {
    this.tween?.scrollTrigger?.kill();
    this.tween?.kill();
    // Put the original markup back, or the split spans leak on re-render.
    this.split?.revert();
  }
}
