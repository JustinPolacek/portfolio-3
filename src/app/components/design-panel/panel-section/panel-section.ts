import { Component, input } from '@angular/core';

@Component({
  selector: 'app-panel-section',
  templateUrl: './panel-section.html',
})
export class PanelSection {
  readonly heading = input('');
  readonly body = input('');
}
