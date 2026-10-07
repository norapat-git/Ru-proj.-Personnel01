export type DialogVariant = 'danger' | 'warning' | 'info';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  subMessage?: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
  requireNote?: boolean;
  noteLabel?: string;
  notePlaceholder?: string;
}

export interface ConfirmDialogResult {
  confirmed: boolean;
  note?: string;
}

export interface ConfirmDialogState extends ConfirmDialogOptions {
  isOpen: boolean;
  isLoading: boolean;
  noteValue: string;
  noteError?: string;
  resolve?: (value: ConfirmDialogResult) => void;
}
