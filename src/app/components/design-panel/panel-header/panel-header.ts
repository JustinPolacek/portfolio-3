import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-panel-header',
  templateUrl: './panel-header.html',
})
export class PanelHeader {
  readonly title = input('');
  readonly closePanel = output<void>();
}
