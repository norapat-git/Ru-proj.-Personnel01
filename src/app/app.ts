import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonnelSearch } from './personnel-search/personnel-search';
import { PersonnelForm } from './personnel-form/personnel-form';
import { PersonnelResult } from './personnel-result/personnel-result';
import { PersonnelService } from './services/personnel.service';
import { ToastComponent } from './components/common/toast/toast.component';
import { ConfirmDialogComponent } from './components/common/confirm-dialog/confirm-dialog.component';
import { OnboardTourComponent } from './components/common/onboard-tour/onboard-tour.component';
import { SettingsDialogComponent } from './components/common/settings-dialog/settings-dialog.component';
import { TourService } from './services/tour.service';
import { SettingsService } from './services/settings.service';
import { environment } from '../environment/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    PersonnelSearch,
    PersonnelForm,
    PersonnelResult,
    ToastComponent,
    ConfirmDialogComponent,
    OnboardTourComponent,
    SettingsDialogComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements OnInit {
  private personnelService = inject(PersonnelService);
  private tourService = inject(TourService);
  private settingsService = inject(SettingsService);
  
  currentMode = this.personnelService.currentModeSignal;
  hasSearched = this.personnelService.hasSearchedSignal;
  notification = this.personnelService.notificationSignal;
  isLoading = this.personnelService.isLoadingSignal;
  loadingMessage = this.personnelService.loadingMessageSignal;

  // สถานะ Modal เลือกสัญชาติก่อนเปิดฟอร์มเพิ่มบุคลากร
  showNationalityPicker = signal<boolean>(false);

  ngOnInit(): void {
    // ขอ JWT Token เฉพาะขั้นตอนการพัฒนา (Development Mode)
    if (!environment.production) {
      const testCitizenId = '1234567890123';
      this.personnelService.acquireToken(testCitizenId);
    }

    // ตั้งค่าสัญชาติเริ่มต้นตามความถนัดของผู้ใช้จาก Cookie
    const defaultNat = this.settingsService.settings().defaultNationality;
    if (defaultNat) {
      this.personnelService.staffNationalitySignal.set(defaultNat);
    }

    // เริ่มต้น Onboarding Tour อัตโนมัติสำหรับผู้ใช้ที่เข้าใช้งานครั้งแรก
    setTimeout(() => {
      if (this.currentMode() === 'result') {
        this.tourService.startTour(false);
      }
    }, 600);
  }

  // เรียกเปิดหน้าต่างการตั้งค่า
  openSettings(): void {
    this.settingsService.open();
  }

  // เรียกเปิด Onboarding Tour ด้วยตนเอง (เมื่อกดปุ่มแนะนำการใช้งาน)
  startTour(): void {
    if (this.currentMode() !== 'result') {
      this.switchMode('result');
      setTimeout(() => {
        this.tourService.startTour(true);
      }, 300);
    } else {
      this.tourService.startTour(true);
    }
  }

  // เปิด Modal เลือกสัญชาติ
  openNationalityPicker() {
    if (this.isLoading()) return;
    this.showNationalityPicker.set(true);
  }

  // ปิด Modal
  closeNationalityPicker() {
    this.showNationalityPicker.set(false);
  }

  // เลือกสัญชาติแล้วเปิดฟอร์มทันที
  pickNationality(nat: 'thai' | 'inter') {
    this.personnelService.staffNationalitySignal.set(nat);
    this.personnelService.editingPersonnel.set(null);
    this.showNationalityPicker.set(false);
    this.personnelService.currentModeSignal.set('form');
  }

  // สลับ mode (ใช้สำหรับปุ่มกลับหน้าค้นหา)
  switchMode(mode: 'result' | 'form') {
    if (this.isLoading()) return;
    if (mode === 'form') {
      // ถ้ากดสลับฟอร์มโดยตรง (ไม่ผ่าน picker) ให้เคลียร์ข้อมูลเดิม
      this.personnelService.editingPersonnel.set(null);
    }
    this.personnelService.currentModeSignal.set(mode);
  }
}
