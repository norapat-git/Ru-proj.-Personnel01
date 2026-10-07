import { Injectable, signal, computed } from '@angular/core';
import { AppTheme } from '../models/theme.model';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly theme = signal<AppTheme>('light');
  readonly isDark = computed(() => false);

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('ru_app_theme');
        document.documentElement.removeAttribute('data-theme');
        document.body.removeAttribute('data-theme');
      } catch {
        // ignore
      }
    }
  }

  toggleTheme(): void {}
  setTheme(_theme: string): void {}
}
