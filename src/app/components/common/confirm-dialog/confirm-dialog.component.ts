import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogService } from '../../../services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css']
})
export class ConfirmDialogComponent {
  dialogService = inject(ConfirmDialogService);
  readonly state = this.dialogService.state;

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
}
