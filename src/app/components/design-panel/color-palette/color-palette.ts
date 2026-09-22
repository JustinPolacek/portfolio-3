import { Component, input } from '@angular/core';

export interface ColorSwatch {
  name: string;
  hex: string;
}

@Component({
  selector: 'app-color-palette',
  templateUrl: './color-palette.html',
})
export class ColorPalette {
  readonly swatches = input<ColorSwatch[]>([]);
}
