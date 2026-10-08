import { Component, inject, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogService } from '../../../services/confirm-dialog.service';
import { ModalScrollLockService } from '../../../services/modal-scroll-lock.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css']
})
export class ConfirmDialogComponent implements OnDestroy {
  dialogService = inject(ConfirmDialogService);
  private scrollLock = inject(ModalScrollLockService);

  readonly state = this.dialogService.state;
  private isCurrentlyLocked = false;

  constructor() {
    effect(() => {
      const open = this.state().isOpen;
      if (open && !this.isCurrentlyLocked) {
        this.scrollLock.lock();
        this.isCurrentlyLocked = true;
      } else if (!open && this.isCurrentlyLocked) {
        this.scrollLock.unlock();
        this.isCurrentlyLocked = false;
      }
    });
  }

  onOverlayClick(): void {
    if (!this.state().isLoading) {
      this.dialogService.cancel();
    }
  }

  onConfirm(): void {
    this.dialogService.submitConfirm();
  }

  onCancel(): void {
    this.dialogService.cancel();
  }

  onNoteChange(value: string): void {
    this.dialogService.setNoteValue(value);
  }

  ngOnDestroy(): void {
    if (this.isCurrentlyLocked) {
      this.scrollLock.unlock();
      this.isCurrentlyLocked = false;
    }
  }
}
