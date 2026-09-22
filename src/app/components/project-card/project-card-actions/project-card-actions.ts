import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-project-card-actions',
  templateUrl: './project-card-actions.html',
})
export class ProjectCardActions {
  readonly url = input<string | undefined>(undefined);
  readonly showNext = input(false);
  readonly openDesignPanel = output<void>();
  readonly next = output<void>();
}
