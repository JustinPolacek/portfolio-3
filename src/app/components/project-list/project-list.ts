import { Component, input, output } from '@angular/core';
import { Project } from '../project-card/project-card';
import { ProjectGallery } from '../project-gallery/project-gallery';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.html',
  imports: [ProjectGallery],
})
export class ProjectList {
  readonly projects = input<Project[]>([]);
  readonly openDesignPanel = output<Project>();
}
