import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
})
export class Header {
  protected readonly theme = inject(ThemeService);
}
