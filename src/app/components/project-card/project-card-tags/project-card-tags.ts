import { Component, input } from '@angular/core';

@Component({
  selector: 'app-project-card-tags',
  templateUrl: './project-card-tags.html',
})
export class ProjectCardTags {
  readonly tags = input<string[]>([]);
}
