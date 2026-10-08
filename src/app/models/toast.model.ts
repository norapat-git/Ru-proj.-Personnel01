export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'news';

export interface ToastItem {
  id: string;
  type: ToastType;
  badge?: string;
  title?: string;
  message: string;
  timestamp?: string;
  durationMs: number;
  createdAt: number;
  isDismissing?: boolean;
}

export interface ToastOptions {
  type?: ToastType;
  badge?: string;
  title?: string;
  message: string;
  timestamp?: string;
  durationMs?: number;
}
