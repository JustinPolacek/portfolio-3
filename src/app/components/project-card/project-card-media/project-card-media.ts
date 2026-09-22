import { Component, input } from '@angular/core';

@Component({
  selector: 'app-project-card-media',
  templateUrl: './project-card-media.html',
})
export class ProjectCardMedia {
  readonly video = input<string | undefined>(undefined);
  readonly image = input<string | undefined>(undefined);
  readonly alt = input('');
}
