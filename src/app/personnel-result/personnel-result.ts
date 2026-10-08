import { Component, inject, signal, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common'; //ฟอร์แมตตัวเลขและเงินเดือน
import { FormsModule } from '@angular/forms';
import { PersonnelService } from '../services/personnel.service';
import { ToastService } from '../services/toast.service';
import { ConfirmDialogService } from '../services/confirm-dialog.service';
import { ModalScrollLockService } from '../services/modal-scroll-lock.service';
import { SkeletonComponent } from '../components/common/skeleton/skeleton.component';
import { ContextMenuItem } from '../models';
import { CustomContextMenuComponent } from '../components/common/custom-context-menu/custom-context-menu.component';

@Component({
  selector: 'app-personnel-result',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule, SkeletonComponent, CustomContextMenuComponent],
  templateUrl: './personnel-result.html',
})
export class PersonnelResult implements OnDestroy {
  private personnelService = inject(PersonnelService);
  private toastService = inject(ToastService);
  private confirmDialogService = inject(ConfirmDialogService);
  private scrollLock = inject(ModalScrollLockService);

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

  // Context Menu State
  contextMenuVisible = signal<boolean>(false);
  contextMenuX = signal<number>(0);
  contextMenuY = signal<number>(0);
  contextMenuPerson = signal<any>(null);

  // Modal แสดงรายละเอียดบุคลากร
  selectedDetailPerson = signal<any>(null);
  private isDetailModalLocked = false;

  contextMenuItems = computed<ContextMenuItem[]>(() => {
    const isFiltered = this.isFilteredSearch();
    return [
      { id: 'view', label: 'ดูรายละเอียดประวัติ', icon: 'visibility' },
      { id: 'copy', label: 'คัดลอกรหัสประจำตัว', icon: 'content_copy', dividerAfter: isFiltered },
      ...(isFiltered
        ? [
            { id: 'edit', label: 'แก้ไขประวัติข้อมูล', icon: 'edit', variant: 'primary' as const },
            { id: 'delete', label: 'ลบข้อมูลบุคลากร', icon: 'delete', variant: 'danger' as const }
          ]
        : [])
    ];
  });

  // Apple Pill Pagination Pages
  paginationPages = computed<(number | string)[]>(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', total);
    } else if (current >= total - 3) {
      pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }
    return pages;
  });

  constructor() {
    // รีเซ็ตหน้ากลับไปหน้า 1 ทุกครั้งที่มีการค้นหาใหม่ หรือข้อมูลในลิสต์เปลี่ยน หรือเปลี่ยนคำค้นหา
    effect(() => {
      this.personnelList();
      this.nameFilter();
      this.currentPage.set(1);
    }, { allowSignalWrites: true });

    // จัดการล็อก Body Scroll เมื่อเปิด Modal รายละเอียดบุคลากร
    effect(() => {
      const detail = this.selectedDetailPerson();
      if (detail && !this.isDetailModalLocked) {
        this.scrollLock.lock();
        this.isDetailModalLocked = true;
      } else if (!detail && this.isDetailModalLocked) {
        this.scrollLock.unlock();
        this.isDetailModalLocked = false;
      }
    });
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
      perPositionMoney: rawSelection.PER_POSITION_MONEY !== undefined && rawSelection.PER_POSITION_MONEY !== null && rawSelection.PER_POSITION_MONEY !== '' ? Number(rawSelection.PER_POSITION_MONEY) : null,
      perPositionPay: rawSelection.PER_POSITION_PAY !== undefined && rawSelection.PER_POSITION_PAY !== null && rawSelection.PER_POSITION_PAY !== '' ? Number(rawSelection.PER_POSITION_PAY) : null,
      perPositionMoneyEx: rawSelection.PER_POSITION_MONEY_EX !== undefined && rawSelection.PER_POSITION_MONEY_EX !== null && rawSelection.PER_POSITION_MONEY_EX !== '' ? Number(rawSelection.PER_POSITION_MONEY_EX) : null,
      perPositionPayEx: rawSelection.PER_POSITION_PAY_EX !== undefined && rawSelection.PER_POSITION_PAY_EX !== null && rawSelection.PER_POSITION_PAY_EX !== '' ? Number(rawSelection.PER_POSITION_PAY_EX) : null,
      perProject: rawSelection.PER_PROJECT !== undefined && rawSelection.PER_PROJECT !== null && rawSelection.PER_PROJECT !== '' ? Number(rawSelection.PER_PROJECT) : null,
      notePvd: rawSelection.NOTE_PVD || null,
      fRevSalary: rawSelection.F_REV_SALARY === 'Y' ? 'Y' : 'N',
      fRevPosMoney: rawSelection.F_REV_POS_MONEY === 'Y' ? 'Y' : 'N',
      fRevPayEx: rawSelection.F_REV_PAY_EX === 'Y' ? 'Y' : 'N',
      fTotalIncome: rawSelection.F_TOTAL_INCOME === 'Y' ? 'Y' : 'N',
    });

    // สลับหน้าจอพื้นที่ส่วนล่างให้เปลี่ยนมาโชว์หน้าแบบฟอร์ม
    this.personnelService.currentModeSignal.set('form');
  }

  // Context Menu Handlers
  onRowContextMenu(event: MouseEvent, person: any): void {
    event.preventDefault();
    this.contextMenuPerson.set(person);
    this.contextMenuX.set(event.clientX);
    this.contextMenuY.set(event.clientY);
    this.contextMenuVisible.set(true);
  }

  openRowMenu(event: MouseEvent, person: any): void {
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.contextMenuPerson.set(person);
    this.contextMenuX.set(rect.left - 180);
    this.contextMenuY.set(rect.bottom + 4);
    this.contextMenuVisible.set(true);
  }

  closeContextMenu(): void {
    this.contextMenuVisible.set(false);
  }

  onContextMenuItemClick(item: ContextMenuItem): void {
    const person = this.contextMenuPerson();
    if (!person) return;

    switch (item.id) {
      case 'view':
        this.openDetailModal(person);
        break;
      case 'copy':
        this.copyPersonnelId(person);
        break;
      case 'edit':
        this.triggerEditMode(person);
        break;
      case 'delete':
        this.triggerDelete(person.PER_CITIZEN_ID || person.PER_PASSPORT_NO);
        break;
    }
  }

  copyPersonnelId(person: any): void {
    const id = person.PER_CITIZEN_ID || person.PER_PASSPORT_NO || '';
    if (!id) return;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(id).then(() => {
        this.toastService.success(`คัดลอกรหัส "${id}" เรียบร้อยแล้ว`, 'คัดลอกสำเร็จ');
      });
    } else {
      this.toastService.info(`รหัส: ${id}`);
    }
  }

  // ฟังก์ชันลบข้อมูลโดยใช้ ConfirmDialogService (พร้อมบันทึกหมายเหตุการลบ)
  async triggerDelete(targetCitizenId: string): Promise<void> {
    if (this.isLoading()) return;

    const person = this.personnelList().find(
      p => (p.PER_CITIZEN_ID || p.PER_PASSPORT_NO) === targetCitizenId
    );
    const personName = person
      ? (person['FULL_NAME_TH'] || person.PER_NAME_TH || person.PER_NAME_EN || targetCitizenId)
      : targetCitizenId;

    const result = await this.confirmDialogService.confirm({
      title: 'ยืนยันการลบข้อมูลบุคลากร',
      message: `คุณต้องการลบข้อมูลของ "${personName}" ออกจากระบบใช่หรือไม่?`,
      subMessage: 'การดำเนินการนี้จะทำการลบข้อมูลออกจากฐานข้อมูลถาวร และไม่สามารถกู้คืนได้',
      variant: 'danger',
      confirmText: 'ลบข้อมูลบุคลากร',
      cancelText: 'ยกเลิก',
      requireNote: true,
      noteLabel: 'สาเหตุ / หมายเหตุการลบข้อมูล',
      notePlaceholder: 'กรุณาระบุสาเหตุหรือหมายเหตุการลบข้อมูลบุคลากร...'
    });

    if (!result.confirmed) {
      return;
    }

    this.personnelService.loadingMessageSignal.set('กำลังลบข้อมูลบุคลากรออกจากระบบ...');
    this.personnelService.isLoadingSignal.set(true);

    try {
      const res = await this.personnelService.deletePersonnel(targetCitizenId, result.note || '');
      if (res && res.success) {
        this.toastService.success(res.message || 'ลบข้อมูลบุคลากรออกจากระบบฐานข้อมูลเรียบร้อยแล้ว');
        // ลบแถวข้อมูลออกจากหน้าจอแสดงผล
        const currentList = this.personnelService.personnelListSignal();
        const targetClean = String(targetCitizenId || '').trim().toUpperCase();
        this.personnelService.personnelListSignal.set(
          currentList.filter(item => {
            const citizen = String(item.PER_CITIZEN_ID || '').trim().toUpperCase();
            const passport = String(item.PER_PASSPORT_NO || '').trim().toUpperCase();
            return citizen !== targetClean && passport !== targetClean;
          })
        );
        this.closeDetailModal();
      }
    } catch (err: any) {
      console.error('Delete Error:', err);
      this.toastService.error('ไม่สามารถลบข้อมูลได้ เนื่องจากระบบเชื่อมต่อฐานข้อมูลขัดข้อง');
    } finally {
      this.personnelService.isLoadingSignal.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.isDetailModalLocked) {
      this.scrollLock.unlock();
      this.isDetailModalLocked = false;
    }
  }
}
