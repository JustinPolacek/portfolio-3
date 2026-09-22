import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(true);

  constructor() {
    effect(() => {
      document.documentElement.classList.toggle('dark', this.isDark());
    });
  }

  toggle(): void {
    this.isDark.update((v) => !v);
  }
}
