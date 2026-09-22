import { Component, input } from '@angular/core';

@Component({
  selector: 'app-panel-footer',
  templateUrl: './panel-footer.html',
})
export class PanelFooter {
  readonly url = input('');
}
