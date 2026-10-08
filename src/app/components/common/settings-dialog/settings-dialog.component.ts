import { Component, inject, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../services/settings.service';
import { TourService } from '../../../services/tour.service';
import { ToastService } from '../../../services/toast.service';
import { ModalScrollLockService } from '../../../services/modal-scroll-lock.service';
import { UserSettings } from '../../../models/settings.model';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.css']
})
export class SettingsDialogComponent implements OnDestroy {
  private settingsService = inject(SettingsService);
  private tourService = inject(TourService);
  private toastService = inject(ToastService);
  private scrollLock = inject(ModalScrollLockService);

  readonly isOpen = this.settingsService.isOpen;
  readonly settings = this.settingsService.settings;

  activeTab: 'general' | 'notifications' | 'accessibility' = 'general';
  private isCurrentlyLocked = false;

  constructor() {
    effect(() => {
      const open = this.isOpen();
      if (open && !this.isCurrentlyLocked) {
        this.scrollLock.lock();
        this.isCurrentlyLocked = true;
      } else if (!open && this.isCurrentlyLocked) {
        this.scrollLock.unlock();
        this.isCurrentlyLocked = false;
      }
    });
  }

  close(): void {
    this.settingsService.close();
  }

  setTab(tab: 'general' | 'notifications' | 'accessibility'): void {
    this.activeTab = tab;
  }

  update<K extends keyof UserSettings>(key: K, value: UserSettings[K]): void {
    this.settingsService.updateSetting(key, value);
  }

  testToast(): void {
    this.toastService.success(
      'นี่คือตัวอย่างข้อความแจ้งเตือนตามการตั้งค่าปัจจุบันของคุณ',
      'ทดสอบการแจ้งเตือนสำเร็จ'
    );
  }

  replayTour(): void {
    this.close();
    setTimeout(() => {
      this.tourService.startTour(true);
    }, 200);
  }

  resetDefaults(): void {
    this.settingsService.resetToDefaults();
    this.toastService.info('คืนค่าการตั้งค่าเริ่มต้นเรียบร้อยแล้ว');
  }

  ngOnDestroy(): void {
    if (this.isCurrentlyLocked) {
      this.scrollLock.unlock();
      this.isCurrentlyLocked = false;
    }
  }
}
