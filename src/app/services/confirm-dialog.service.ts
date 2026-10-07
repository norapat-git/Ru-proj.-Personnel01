import { Injectable, signal } from '@angular/core';
import {
  ConfirmDialogOptions,
  ConfirmDialogResult,
  ConfirmDialogState,
} from '../models/confirm-dialog.model';

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  readonly state = signal<ConfirmDialogState>({
    isOpen: false,
    isLoading: false,
    title: '',
    message: '',
    variant: 'danger',
    noteValue: '',
    confirmText: 'ยืนยัน',
    cancelText: 'ยกเลิก'
  });

  confirm(options: ConfirmDialogOptions): Promise<ConfirmDialogResult> {
    return new Promise((resolve) => {
      this.state.set({
        ...options,
        variant: options.variant || 'danger',
        confirmText: options.confirmText || 'ยืนยัน',
        cancelText: options.cancelText || 'ยกเลิก',
        isOpen: true,
        isLoading: false,
        noteValue: '',
        noteError: undefined,
        resolve
      });
    });
  }

  setNoteValue(value: string): void {
    this.state.update(s => ({
      ...s,
      noteValue: value,
      noteError: s.requireNote && !value.trim() ? 'กรุณาระบุหมายเหตุก่อนดำเนินการ' : undefined
    }));
  }

  setLoading(loading: boolean): void {
    this.state.update(s => ({ ...s, isLoading: loading }));
  }

  submitConfirm(): void {
    const current = this.state();
    if (current.requireNote && !current.noteValue.trim()) {
      this.state.update(s => ({ ...s, noteError: 'กรุณาระบุหมายเหตุก่อนดำเนินการ' }));
      return;
    }

    if (current.resolve) {
      current.resolve({ confirmed: true, note: current.noteValue.trim() });
    }
    this.close();
  }

  cancel(): void {
    const current = this.state();
    if (current.resolve) {
      current.resolve({ confirmed: false });
    }
    this.close();
  }

  private close(): void {
    this.state.update(s => ({ ...s, isOpen: false, isLoading: false }));
  }
}
