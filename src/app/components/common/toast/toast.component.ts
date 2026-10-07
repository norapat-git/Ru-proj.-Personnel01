import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastItem } from '../../../models/toast.model';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent {
  private toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  trackById(index: number, item: ToastItem): string {
    return item.id;
  }
}
