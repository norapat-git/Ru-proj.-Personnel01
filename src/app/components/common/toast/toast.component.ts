import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastItem } from '../../../models/toast.model';
import { ToastService } from '../../../services/toast.service';
import { SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent {
  private toastService = inject(ToastService);
  private settingsService = inject(SettingsService);

  readonly toasts = this.toastService.toasts;
  readonly position = computed(() => this.settingsService.settings().toastPosition || 'bottom-right');

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  trackById(index: number, item: ToastItem): string {
    return item.id;
  }
}
