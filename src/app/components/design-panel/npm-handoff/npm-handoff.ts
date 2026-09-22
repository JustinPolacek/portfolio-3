import { Component, input } from '@angular/core';

export interface NpmHandoffData {
  packageName: string;
  version: string;
  size: string;
  license: string;
}

@Component({
  selector: 'app-npm-handoff',
  templateUrl: './npm-handoff.html',
})
export class NpmHandoff {
  readonly data = input<NpmHandoffData>({
    packageName: '@rollnat/design-system',
    version: '2.1.4',
    size: '42.3 KB',
    license: 'MIT',
  });
}
