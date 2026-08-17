import { Component, inject, signal, computed, effect } from '@angular/core';
import { DecimalPipe } from '@angular/common'; //ฟอร์แมตตัวเลขและเงินเดือน
import { FormsModule } from '@angular/forms';
import { PersonnelService } from '../services/services';

@Component({
  selector: 'app-personnel-result',
  standalone: true,
  imports: [DecimalPipe, FormsModule], //DecimalPipe ตัดทศนิยมเงินเดือนหน้าจอ
  templateUrl: './personnel-result.html',
})
export class PersonnelResult {
  private personnelService = inject(PersonnelService);

  personnelList = this.personnelService.personnelListSignal;
  isFilteredSearch = this.personnelService.isFilteredSearchSignal;
  isLoading = this.personnelService.isLoadingSignal; // สัญญาณสถานะ Loading

  // สัญญาณแชร์สัญชาติ
  nationality = this.personnelService.staffNationalitySignal;

  // Pagination Config (20 รายต่อหน้า)
  readonly pageSize = 20;
  currentPage = signal<number>(1);

  // คำค้นหากรองชื่อ-นามสกุลแบบ Real-time ทันทีที่พิมพ์
  nameFilter = signal<string>('');

  constructor() {
    // รีเซ็ตหน้ากลับไปหน้า 1 ทุกครั้งที่มีการค้นหาใหม่ หรือข้อมูลในลิสต์เปลี่ยน หรือเปลี่ยนคำค้นหา
    effect(() => {
      this.personnelList();
      this.nameFilter();
      this.currentPage.set(1);
    }, { allowSignalWrites: true });
  }

  // รายการบุคลากรที่ผ่านการกรองชื่อ-นามสกุลแบบ Real-time
  filteredPersonnelList = computed(() => {
    const list = this.personnelList();
    const query = this.nameFilter().trim().toLowerCase();

    if (!query) {
      return list;
    }

    return list.filter((person) => {
      const nameTh = String(person.PER_NAME_TH || '').toLowerCase();
      const fullNameTh = String(person.FULL_NAME_TH || '').toLowerCase();
      const nameEn = String(person.PER_NAME_EN || '').toLowerCase();
      const preName = String(person.PRE_NAME || person.PRE_CODE || '').toLowerCase();
      const combinedTh = `${preName} ${nameTh}`.toLowerCase();

      return nameTh.includes(query) || 
             fullNameTh.includes(query) || 
             nameEn.includes(query) || 
             combinedTh.includes(query);
    });
  });

  // จำนวนหน้ารวมทั้งหมด
  totalPages = computed(() => {
    const total = this.filteredPersonnelList().length;
    return Math.ceil(total / this.pageSize) || 1;
  });

  // ตัดข้อมูลสำหรับแสดงผลเฉพาะหน้าที่เลือก
  paginatedPersonnelList = computed(() => {
    const list = this.filteredPersonnelList();
    const start = (this.currentPage() - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  // ลำดับรายการเริ่มต้นของหน้าที่กำลังแสดง
  get startItemIndex(): number {
    if (this.filteredPersonnelList().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize + 1;
  }

  // ลำดับรายการสุดท้ายของหน้าที่กำลังแสดง
  get endItemIndex(): number {
    return Math.min(this.currentPage() * this.pageSize, this.filteredPersonnelList().length);
  }

  // เปลี่ยนหน้า
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  // ล้างคำค้นหาด่วน
  clearNameFilter(): void {
    this.nameFilter.set('');
  }

  // Modal แสดงรายละเอียดบุคลากร
  selectedDetailPerson = signal<any>(null);

  openDetailModal(person: any): void {
    this.selectedDetailPerson.set(person);
  }

  closeDetailModal(): void {
    this.selectedDetailPerson.set(null);
  }

  // Modal ยืนยันการลบ
  deleteTargetId: string | null = null;
  deleteNote: string = '';
  deleteNoteError: boolean = false;

  // แปลงรูปแบบวันที่ ISO/Timestamp เป็น วัน/เดือน/ปี (เช่น 26/06/2026)
  formatDate(dateVal: any): string {
    if (!dateVal) return '-';
    const str = String(dateVal).trim();
    if (!str) return '-';

    const isoDate = str.substring(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      const [year, month, day] = isoDate.split('-');
      return `${day}/${month}/${year}`;
    }
    return isoDate || str;
  }

  // ฟังก์ชันรองรับการกดปุ่มดึงข้อมูลไปแก้ไขจากในตาราง
  triggerEditMode(rawSelection: any): void {
    // แปลงตัวพิมพ์ใหญ่เป็นพิมพ์เล็ก
    this.personnelService.editingPersonnel.set({
      perCitizenId: rawSelection.PER_CITIZEN_ID,
      typeCode: rawSelection.TYPE_CODE,
      typeName: rawSelection.TYPE_NAME,
      perSlipId: rawSelection.PER_SLIP_ID,
      perPosId: rawSelection.PER_POS_ID,
      preCode: rawSelection.PRE_CODE,
      preName: rawSelection.PRE_NAME,
      perNameTh: rawSelection.PER_NAME_TH,
      perNameEn: rawSelection.PER_NAME_EN,
      perFirstNameEn: '',
      perMiddleNameEn: '',
      perLastNameEn: '',
      perTaxId: rawSelection.PER_TAX_ID,
      perPvdfApp: rawSelection.PER_PVDF_APP ? String(rawSelection.PER_PVDF_APP).trim().toUpperCase() : '',
      // ตัดความยาวสตริงวันที่ให้เหลือ 10 หลัก
      perPvdfAppD: rawSelection.PER_PVDF_APP_D
        ? rawSelection.PER_PVDF_APP_D.substring(0, 10)
        : null,
      perPvdfQuit: Number(rawSelection.PER_PVDF_QUIT) === 1 ? 1 : null,
      perPvdfQuitD: rawSelection.PER_PVDF_QUIT_D
        ? rawSelection.PER_PVDF_QUIT_D.substring(0, 10)
        : null,
      perFundType: rawSelection.PER_FUND_TYPE,
      perSaveRate: rawSelection.PER_SAVE_RATE,
      perSsoPayment: rawSelection.PER_SSO_PAYMENT,
      perFundTeacher: rawSelection.PER_FUND_TEACHER,
      perFundAssteacher: rawSelection.PER_FUND_ASSTEACHER,
      perSsoId: rawSelection.PER_SSO_ID,
      perPassportNo: rawSelection.PER_PASSPORT_NO,
      perPassportStartD: rawSelection.PER_PASSPORT_START_D
        ? rawSelection.PER_PASSPORT_START_D.substring(0, 10)
        : null,
      perPassportExpireD: rawSelection.PER_PASSPORT_EXPIRE_D
        ? rawSelection.PER_PASSPORT_EXPIRE_D.substring(0, 10)
        : null,
      poscName: rawSelection.POSC_NAME,
      perFacC: rawSelection.PER_FAC_C,
      facName: rawSelection.FAC_NAME,
      perSalary: rawSelection.PER_SALARY,
      perHoldSalary: rawSelection.PER_HOLD_SALARY,
      perSourceMoney: rawSelection.PER_SOURCE_MONEY !== undefined && rawSelection.PER_SOURCE_MONEY !== null && rawSelection.PER_SOURCE_MONEY !== '' ? Number(rawSelection.PER_SOURCE_MONEY) : null,
      notePvd: rawSelection.NOTE_PVD || null,
      fRevSalary: rawSelection.F_REV_SALARY === 'Y' ? 'Y' : 'N',
      fRevPosMoney: rawSelection.F_REV_POS_MONEY === 'Y' ? 'Y' : 'N',
      fRevPayEx: rawSelection.F_REV_PAY_EX === 'Y' ? 'Y' : 'N',
      fTotalIncome: rawSelection.F_TOTAL_INCOME === 'Y' ? 'Y' : 'N',
    });

    // สลับหน้าจอพื้นที่ส่วนล่างให้เปลี่ยนมาโชว์หน้าแบบฟอร์ม
    this.personnelService.currentModeSignal.set('form');
  }

  // ฟังก์ชันกดลบข้อมูลจากขอบด้านล่างของแผงรายละเอียด Card
  triggerDelete(targetCitizenId: string): void {
    this.deleteTargetId = targetCitizenId;
    this.deleteNote = '';
    this.deleteNoteError = false;
  }

  cancelDelete(): void {
    this.deleteTargetId = null;
    this.deleteNote = '';
    this.deleteNoteError = false;
  }

  async confirmDelete(): Promise<void> {
    if (this.isLoading()) {
      return;
    }

    const targetId = this.deleteTargetId;
    if (!targetId) return;

    if (!this.deleteNote || !this.deleteNote.trim()) {
      this.deleteNoteError = true;
      return;
    }

    this.personnelService.loadingMessageSignal.set('กำลังลบข้อมูลบุคลากรออกจากระบบ...');
    this.personnelService.isLoadingSignal.set(true);

    try {
      const res = await this.personnelService.deletePersonnel(targetId, this.deleteNote.trim());
      if (res && res.success) {
        this.personnelService.notificationSignal.set({ 
          type: 'success', 
          message: res.message || 'ลบข้อมูลบุคลากรออกจากระบบฐานข้อมูลเรียบร้อยแล้ว' 
        });
        setTimeout(() => this.personnelService.notificationSignal.set(null), 3000);

        // ลบแถวข้อมูลออกจากหน้าจอแสดงผลของหน้าบ้านทันที
        const currentList = this.personnelService.personnelListSignal();
        this.personnelService.personnelListSignal.set(
          currentList.filter((item) => (item.PER_CITIZEN_ID || item.PER_PASSPORT_NO) !== targetId),
        );
      }
      this.deleteTargetId = null;
      this.deleteNote = '';
      this.deleteNoteError = false;
    } catch (err: any) {
      console.error('Delete Error:', err);
      this.personnelService.notificationSignal.set({ 
        type: 'error', 
        message: 'ไม่สามารถลบข้อมูลได้ เนื่องจากระบบเชื่อมต่อฐานข้อมูลขัดข้อง' 
      });
      setTimeout(() => this.personnelService.notificationSignal.set(null), 3000);
      this.deleteTargetId = null;
      this.deleteNote = '';
      this.deleteNoteError = false;
    } finally {
      this.personnelService.isLoadingSignal.set(false);
    }
  }
}
