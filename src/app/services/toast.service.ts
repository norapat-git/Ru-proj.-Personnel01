import { Injectable, signal, inject } from '@angular/core';
import { ToastItem, ToastOptions, ToastType } from '../models/toast.model';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private settingsService = inject(SettingsService);
  readonly toasts = signal<ToastItem[]>([]);
  private readonly dismissTimers = new Map<string, any>();

  private formatDefaultTimestamp(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `วันนี้ ${hours}:${minutes} น.`;
  }

  show(options: ToastOptions): string {
    const type = options.type || 'info';
    
    // Check if user disabled success toasts in settings
    if (type === 'success' && !this.settingsService.settings().enableSuccessToast) {
      return '';
    }

    const defaultDuration = this.settingsService.settings().toastDurationMs;
    const duration = options.durationMs !== undefined ? options.durationMs : defaultDuration;
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    const newToast: ToastItem = {
      id,
      type,
      badge: options.badge || (options.type === 'news' ? 'NEWS' : undefined),
      title: options.title,
      message: options.message,
      timestamp: options.timestamp || this.formatDefaultTimestamp(),
      durationMs: duration,
      createdAt: Date.now(),
      isDismissing: false
    };

    this.toasts.update(list => [...list, newToast]);

    if (duration > 0) {
      const timer = setTimeout(() => {
        this.dismiss(id);
      }, duration);
      this.dismissTimers.set(id, timer);
    }

    return id;
  }

  success(message: string, title: string = 'สำเร็จ', options?: Partial<ToastOptions>): string {
    return this.show({
      type: 'success',
      title,
      message,
      ...options
    });
  }

  error(message: string, title: string = 'เกิดข้อผิดพลาด', options?: Partial<ToastOptions>): string {
    return this.show({
      type: 'error',
      title,
      message,
      durationMs: options?.durationMs !== undefined ? options.durationMs : 5500,
      ...options
    });
  }

  warning(message: string, title: string = 'ข้อควรระวัง', options?: Partial<ToastOptions>): string {
    return this.show({
      type: 'warning',
      title,
      message,
      ...options
    });
  }

  info(message: string, title: string = 'แจ้งเตือน', options?: Partial<ToastOptions>): string {
    return this.show({
      type: 'info',
      title,
      message,
      ...options
    });
  }

  news(title: string, message: string, options?: Partial<ToastOptions>): string {
    return this.show({
      type: 'news',
      badge: options?.badge || 'NEWS',
      title,
      message,
      durationMs: options?.durationMs !== undefined ? options.durationMs : 6000,
      ...options
    });
  }

  dismiss(id: string): void {
    if (!id) return;
    if (this.dismissTimers.has(id)) {
      clearTimeout(this.dismissTimers.get(id));
      this.dismissTimers.delete(id);
    }

    // Trigger smooth exit animation
    this.toasts.update(list =>
      list.map(t => (t.id === id ? { ...t, isDismissing: true } : t))
    );

    // Wait for 260ms exit animation before removing from DOM
    setTimeout(() => {
      this.toasts.update(list => list.filter(t => t.id !== id));
    }, 260);
  }

  clear(): void {
    this.dismissTimers.forEach(timer => clearTimeout(timer));
    this.dismissTimers.clear();
    this.toasts.set([]);
  }
}
