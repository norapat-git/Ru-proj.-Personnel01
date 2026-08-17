import { Component, inject, OnInit, signal } from '@angular/core';
import { PersonnelSearch } from './personnel-search/personnel-search';
import { PersonnelForm } from './personnel-form/personnel-form';
import { PersonnelResult } from './personnel-result/personnel-result';
import { PersonnelService } from './services/services';
import { environment } from '../environment/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PersonnelSearch, PersonnelForm, PersonnelResult],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements OnInit {
  private personnelService = inject(PersonnelService);
  
  currentMode = this.personnelService.currentModeSignal;
  hasSearched = this.personnelService.hasSearchedSignal;
  notification = this.personnelService.notificationSignal;
  isLoading = this.personnelService.isLoadingSignal;
  loadingMessage = this.personnelService.loadingMessageSignal;

  // สถานะ Modal เลือกสัญชาติก่อนเปิดฟอร์มเพิ่มบุคลากร
  showNationalityPicker = signal<boolean>(false);

  ngOnInit(): void {
    //ขอ JWT Token เฉพาะขั้นตอนการพัฒนา (Development Mode)
    if (!environment.production) {
      const testCitizenId = '1234567890123';
      this.personnelService.acquireToken(testCitizenId);
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
