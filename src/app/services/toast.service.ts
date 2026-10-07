import { Injectable, signal } from '@angular/core';
import { ToastItem, ToastOptions } from '../models/toast.model';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<ToastItem[]>([]);

  show(options: ToastOptions): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const duration = options.durationMs !== undefined ? options.durationMs : 4000;
    const newToast: ToastItem = {
      id,
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      durationMs: duration,
      createdAt: Date.now()
    };

    this.toasts.update(list => [...list, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  success(message: string, title: string = 'สำเร็จ'): string {
    return this.show({ type: 'success', title, message, durationMs: 3500 });
  }

  error(message: string, title: string = 'เกิดข้อผิดพลาด'): string {
    return this.show({ type: 'error', title, message, durationMs: 5000 });
  }

  warning(message: string, title: string = 'ข้อควรระวัง'): string {
    return this.show({ type: 'warning', title, message, durationMs: 4000 });
  }

  info(message: string, title: string = 'แจ้งเตือน'): string {
    return this.show({ type: 'info', title, message, durationMs: 3500 });
  }

  dismiss(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
