import {Component, inject, input, output} from '@angular/core';
import {LanguageService} from '@shared/service/language.service';
import {ThemeService} from '@shared/service/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  readonly language = inject(LanguageService);
  readonly theme = inject(ThemeService);
  readonly menuOpen = input(false);
  readonly menuToggle = output<void>();
}
