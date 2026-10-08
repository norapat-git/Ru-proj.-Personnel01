import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UserSettings, DEFAULT_USER_SETTINGS } from '../models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private platformId = inject(PLATFORM_ID);
  private readonly COOKIE_NAME = 'ru_user_settings';
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly isOpen = signal<boolean>(false);
  readonly settings = signal<UserSettings>(this.loadSettingsFromCookie());

  constructor() {
    // Apply DOM side-effects whenever settings change
    effect(() => {
      const current = this.settings();
      if (this.isBrowser) {
        this.saveSettingsToCookie(current);
        this.applyDomSettings(current);
      }
    });
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): void {
    this.settings.update(prev => ({
      ...prev,
      [key]: value
    }));
  }

  resetToDefaults(): void {
    this.settings.set({ ...DEFAULT_USER_SETTINGS });
  }

  /**
   * Cookie Utilities
   */
  private getCookie(name: string): string | null {
    if (!this.isBrowser) return null;
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  }

  private setCookie(name: string, value: string, days: number = 365): void {
    if (!this.isBrowser) return;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = '; expires=' + date.toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
  }

  private loadSettingsFromCookie(): UserSettings {
    try {
      const cookieValue = this.getCookie(this.COOKIE_NAME);
      if (cookieValue) {
        const parsed = JSON.parse(cookieValue);
        return { ...DEFAULT_USER_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to parse user settings cookie:', e);
    }
    return { ...DEFAULT_USER_SETTINGS };
  }

  private saveSettingsToCookie(settings: UserSettings): void {
    try {
      this.setCookie(this.COOKIE_NAME, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save user settings cookie:', e);
    }
  }

  private applyDomSettings(settings: UserSettings): void {
    const root = document.documentElement;
    if (!root) return;

    // Font Scaling
    if (settings.fontSizeScale === 'large') {
      root.classList.add('large-font-mode');
    } else {
      root.classList.remove('large-font-mode');
    }

    // Reduce Motion
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion-mode');
    } else {
      root.classList.remove('reduce-motion-mode');
    }
  }
}
