import { Component, Output, EventEmitter, inject, OnInit, OnDestroy, ChangeDetectorRef, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PersonnelService } from '../services/services';
import { PersonnelInsertInput, PrenameOption, FacultyOption, PersonTypeOption, FundTypeOption, ProjectTypeOption, SourceMoneyOption } from '../models/personnel';
import { environment } from '../../environment/environment';

@Component({
  selector: 'app-personnel-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './personnel-form.html',
  styleUrl: './personnel-form.css',
})
export class PersonnelForm implements OnInit, OnDestroy {
  @Output() onCancel = new EventEmitter<void>();

  private personnelService = inject(PersonnelService);
  private cdr = inject(ChangeDetectorRef);

  // ดึง nationality value from service
  nationality = this.personnelService.staffNationalitySignal;
  isLoading = this.personnelService.isLoadingSignal;
  isLoadingOptions = signal<boolean>(false);

  // form control logic
  isEditMode: boolean = false;

  // popup result save
  formMessage: { type: 'success' | 'error'; text: string } | null = null;

  // โหลดจาก API FACULTY_CODE
  facultyOptions: FacultyOption[] = [];

  // โหลดจาก API PRENAME_CODE
  prenameOptions: PrenameOption[] = [];

  // โหลดจาก API PERSONTYPE
  personTypeOptions: PersonTypeOption[] = [];

  // โหลดจาก API FUND_TYPE
  fundTypeOptions: FundTypeOption[] = [];

  // โหลดจาก API PROJECT_TYPE
  projectTypeOptions: ProjectTypeOption[] = [];

  // โหลดจาก API SOURCE_MONEY
  sourceMoneyOptions: SourceMoneyOption[] = [];

  personnelData: PersonnelInsertInput = {
    perCitizenId: '',
    typeCode: null,
    typeName: '',
    perSlipId: '',
    perPosId: null,
    preCode: null,
    preName: '',
    perNameTh: '',
    perNameEn: '',
    perFirstNameEn: '',
    perMiddleNameEn: '',
    perLastNameEn: '',
    perTaxId: '',
    perPvdfApp: '',
    perPvdfAppD: null,
    perPvdfQuit: null,
    perPvdfQuitD: null,
    perFundType: null,
    perSaveRate: null,
    perSsoPayment: null,
    perFundTeacher: null,
    perFundAssteacher: null,
    perSsoId: '',
    perPassportNo: '',
    perPassportStartD: null,
    perPassportExpireD: null,
    poscName: '',
    perFacC: null,
    facName: '',
    perSalary: null,
    perHoldSalary: null,
    perSourceMoney: null,
    perPositionMoney: null,
    perPositionPay: null,
    perPositionMoneyEx: null,
    perPositionPayEx: null,
    perProject: null,
    fRevSalary: 'N',
    fRevPosMoney: 'N',
    fRevPayEx: 'N',
    fTotalIncome: 'N',
  };

  // ตรวจสอบข้อผิดพลาด input form
  invalidFields: { [key: string]: boolean } = {};

  // ตรวจสอบสถานะและหยอดข้อมูลเดิมเข้าช่องอินพุตอัตโนมัติเมื่อหน้าจอแบบฟอร์มเปิดตัวทำงาน
  async ngOnInit(): Promise<void> {
    // 1. โหลดข้อมูลแก้ไขขึ้นมาทันทีในเฟรมแรกแบบ Synchronous
    const editPayload = this.personnelService.editingPersonnel();
    if (editPayload) {
      this.isEditMode = true;
      this.personnelData = { ...editPayload };

      // ตรวจสอบและสลับสัญชาติอัตโนมัติตามข้อมูลที่โหลดมาแก้ไข
      if (editPayload.perPassportNo && !editPayload.perCitizenId) {
        this.personnelService.staffNationalitySignal.set('inter');
      } else {
        this.personnelService.staffNationalitySignal.set('thai');
      }

      // เมื่อโหลดข้อมูลแก้ไข ให้แตก PER_NAME_TH กลับเป็น first/last name
      if (editPayload.perNameTh) {
        const thParts = editPayload.perNameTh.trim().split(/\s+/);
        if (thParts.length >= 2) {
          this.personnelData.perFirstNameTh = thParts[0];
          this.personnelData.perLastNameTh = thParts.slice(1).join(' ');
        } else {
          this.personnelData.perFirstNameTh = editPayload.perNameTh;
          this.personnelData.perLastNameTh = '';
        }
      }

      // เมื่อโหลดข้อมูลแก้ไข ให้แตก PER_NAME_EN กลับเป็น first/middle/last name
      const parts = (editPayload.perNameEn || '').trim().split(/\s+/);
      if (parts.length >= 2) {
        this.personnelData.perFirstNameEn = parts[0];
        this.personnelData.perLastNameEn = parts[parts.length - 1];
        this.personnelData.perMiddleNameEn = parts.length > 2 ? parts.slice(1, -1).join(' ') : '';
      } else {
        this.personnelData.perFirstNameEn = editPayload.perNameEn || '';
        this.personnelData.perMiddleNameEn = '';
        this.personnelData.perLastNameEn = '';
      }
      this.cdr.detectChanges();
    }

    // 2. โหลดข้อมูลตัวเลือกทั้งหมดสำหรับ Dropdowns จาก API พร้อมกัน (Parallel Fetching)
    this.isLoadingOptions.set(true);
    try {
      const [facRes, preRes, typeRes, fundRes, projRes, moneyRes] = await Promise.all([
        this.personnelService.getFaculties().catch((err: any) => {
          console.error('Load faculties failed:', err);
          return null;
        }),
        this.personnelService.getPrenames().catch((err: any) => {
          console.error('Load prenames failed:', err);
          return null;
        }),
        this.personnelService.getPersonTypes().catch((err: any) => {
          console.error('Load personTypes failed:', err);
          return null;
        }),
        this.personnelService.getFundTypes().catch((err: any) => {
          console.error('Load fundTypes failed:', err);
          return null;
        }),
        this.personnelService.getProjectTypes().catch((err: any) => {
          console.error('Load projectTypes failed:', err);
          return null;
        }),
        this.personnelService.getSourceMoneyTypes().catch((err: any) => {
          console.error('Load sourceMoneyTypes failed:', err);
          return null;
        }),
      ]);

      if (facRes?.success && facRes.data) {
        this.facultyOptions = facRes.data.map((row: any) => ({
          facCode: row.FAC_CODE,
          facName: row.FAC_NAME,
          facName2: row.FAC_NAME2,
        }));
      }

      if (preRes?.success && preRes.data) {
        this.prenameOptions = preRes.data.map((row: any) => ({
          preCode: row.PRE_CODE,
          preName: row.PRE_NAME,
          preName2: row.PRE_NAME2,
          preNameEn: row.PRE_NAME_EN,
          preNameIdcard: row.PRE_NAME_IDCARD,
        }));
      }

      if (typeRes?.success && typeRes.data) {
        this.personTypeOptions = typeRes.data.map((row: any) => ({
          typeCode: row.TYPE_CODE,
          typeName: row.TYPE_NAME,
          typeName2: row.TYPE_NAME2,
        }));
      }

      if (fundRes?.success && fundRes.data) {
        this.fundTypeOptions = fundRes.data.map((row: any) => ({
          fundCode: row.FUND_CODE,
          fundName: row.FUND_NAME,
        }));
      }

      if (projRes?.success && projRes.data) {
        this.projectTypeOptions = projRes.data.map((row: any) => ({
          proCode: row.PRO_CODE,
          proName: row.PRO_NAME,
        }));
      }

      if (moneyRes?.success && moneyRes.data) {
        this.sourceMoneyOptions = moneyRes.data.map((row: any) => ({
          smCode: row.SM_CODE,
          smName: row.SM_NAME,
        }));
      }
    } finally {
      this.isLoadingOptions.set(false);
      this.cdr.detectChanges();
    }

    this.cdr.detectChanges();
  }

  // ดึงข้อความคำนำหน้านามสำหรับแสดงใน dropdown
  getSelectedPrenameText(): string {
    return this.personnelData.preName || '';
  }

  // เมื่อเลือกคำนำหน้านามใน dropdown
  onPrenameSelect(preNameText: string) {
    const isInter = this.nationality() === 'inter';
    const found = this.prenameOptions.find(p => isInter ? (p.preNameEn === preNameText || p.preName === preNameText) : p.preName === preNameText);
    if (found) {
      this.personnelData.preCode = found.preCode;
      this.personnelData.preName = found.preName;
    } else {
      this.personnelData.preName = preNameText;
    }
  }

  // ดึงชื่อประเภทบุคลากรสำหรับแสดงใน dropdown
  getSelectedPersonTypeName(): string {
    if (this.personnelData.typeName) return this.personnelData.typeName;
    if (this.personnelData.typeCode) {
      const found = this.personTypeOptions.find(t => t.typeCode === this.personnelData.typeCode);
      return found ? found.typeName : '';
    }
    return '';
  }

  // ดึงชื่อคณะสำหรับแสดงใน dropdown
  getSelectedFacultyName(): string {
    if (this.personnelData.facName) return this.personnelData.facName;
    if (this.personnelData.perFacC) {
      const found = this.facultyOptions.find(f => f.facCode === this.personnelData.perFacC);
      return found ? found.facName : '';
    }
    return '';
  }

  // รวมชื่อ-นามสกุล ภาษาไทย
  onThaiNameInput(field: string) {
    const first = (this.personnelData.perFirstNameTh || '').trim();
    const last = (this.personnelData.perLastNameTh || '').trim();
    this.personnelData.perNameTh = `${first} ${last}`.trim();
  }

  // รวมชื่อ-นามสกุล ภาษาอังกฤษ (First Middle Last)
  onEnglishNameInput(field: string) {
    const first = (this.personnelData.perFirstNameEn || '').trim();
    const middle = (this.personnelData.perMiddleNameEn || '').trim();
    const last = (this.personnelData.perLastNameEn || '').trim();
    this.personnelData.perNameEn = [first, middle, last].filter(Boolean).join(' ');
  }

  // เมื่อเลือกคณะออโต้ FAC_CODE ลงช่อง perFacC
  onFacultySelect(facName: string) {
    const found = this.facultyOptions.find(f => f.facName === facName);
    this.personnelData.facName = facName;
    this.personnelData.perFacC = found ? found.facCode : null;
  }

  // drop down(PRENAME_CODE)
  onPreCodeSelect(code: number | null) {
    const numCode = code !== null && code !== undefined ? Number(code) : null;
    if (numCode) {
      this.personnelData.preCode = numCode;
      const found = this.prenameOptions.find(p => p.preCode === numCode);
      this.personnelData.preName = found ? found.preName : '';
    } else {
      this.personnelData.preCode = null;
      this.personnelData.preName = '';
    }
  }

  // dropdown PERSONTYPE เมื่อเลือก typeName แล้ว typeCode จะเปลี่ยนอัตโนมัติ
  onPersonTypeSelect(typeName: string) {
    const found = this.personTypeOptions.find(t => t.typeName === typeName);
    this.personnelData.typeName = typeName;
    this.personnelData.typeCode = found ? found.typeCode : null;

    // ถ้า TypeCode เป็น 10 หรือ 11 ช่องประกันสังคมจะล็อกไม่ให้ชำระทันที (อายุเกิน 60 ปี)
    if (this.isSsoPaymentDisabled()) {
      this.personnelData.perSsoPayment = 3;
    } else if (this.personnelData.perSsoPayment === 3) {
      this.personnelData.perSsoPayment = 1;
    }
  }

  // dropdown FUND_TYPE เมื่อเลือก fundName แล้ว perFundType จะเปลี่ยนอัตโนมัติ
  onFundTypeSelect(fundName: string) {
    const found = this.fundTypeOptions.find(f => f.fundName === fundName);
    this.personnelData.perFundType = found ? found.fundCode : null;
  }

  // helper: แปลง fundCode เป็น fundName สำหรับ [ngModel]
  getFundNameByCode(code: number | null): string {
    if (!code) return '';
    const found = this.fundTypeOptions.find(f => f.fundCode === code);
    return found ? found.fundName : '';
  }

  // บังคับกรอกเฉพาะตัวเลข
  onNumberInput(event: any, fieldName: string, maxLength: number) {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/[^0-9]/g, '');
    if (val.length > maxLength) {
      val = val.slice(0, maxLength);
    }
    if (fieldName === 'perCitizenId' || fieldName === 'perTaxId' || fieldName === 'perSsoId') {
      (this.personnelData as any)[fieldName] = val;
    } else {
      (this.personnelData as any)[fieldName] = val ? Number(val) : null;
    }
    input.value = val;
    // ล้าง error เมื่อผู้ใช้เริ่มแก้ไข
    if (this.invalidFields[fieldName]) {
      this.invalidFields[fieldName] = false;
    }
  }

  // กรอกทศนิยม
  onDecimalInput(event: any, fieldName: string, maxLength: number) {
    const input = event.target as HTMLInputElement;
    let val = input.value;
    val = val.replace(/[^0-9.]/g, '');
    const dotIndex = val.indexOf('.');
    if (dotIndex !== -1) {
      val = val.substring(0, dotIndex + 1) + val.substring(dotIndex + 1).replace(/\./g, '');
      const parts = val.split('.');
      if (parts[1].length > 2) {
        parts[1] = parts[1].slice(0, 2);
        val = parts.join('.');
      }
    }
    if (val.length > maxLength) {
      val = val.slice(0, maxLength);
    }
    (this.personnelData as any)[fieldName] = val ? Number(val) : null;
    input.value = val;
    if (this.invalidFields[fieldName]) {
      this.invalidFields[fieldName] = false;
    }
  }

  // ===================== Checkbox & Quit PVD Handlers =====================

  /** ตรวจสอบว่าเป็นสมาชิกกองทุน PVD ที่ยังไม่ได้ออกจากกองทุนหรือไม่ */
  isFundActiveMember(): boolean {
    if (this.personnelData.perPvdfQuit === 1) return false;
    const appVal = this.personnelData.perPvdfApp ? String(this.personnelData.perPvdfApp).trim().toUpperCase() : '';
    return appVal === 'Y' || appVal === '1' || appVal === 'TRUE';
  }

  /** ตรวจสอบว่าเป็นสมาชิกกองทุน PVD (หรือเคยสมัคร/มีข้อมูล PVD) หรือไม่ */
  isPvdfMember(): boolean {
    return this.isFundActiveMember();
  }

  /** สลับสถานะกดปุ่มระหว่าง เป็นสมาชิกกองทุน (สีเขียว) และ ออกจากกองทุน (สีแดง) */
  toggleQuitPvd() {
    if (this.isFundActiveMember()) {
      // ปัจจุบันเป็นสมาชิก -> กดปุ่มสีแดง "🚪 ออกจากกองทุน" -> สลับเป็นไม่ได้เป็นสมาชิก/ออกจากกองทุน
      this.personnelData.perPvdfQuit = 1;
      this.personnelData.perPvdfApp = 'N';
      this.personnelData.perPvdfAppD = null;
      this.personnelData.perFundType = null;
      this.personnelData.perSaveRate = null;
      if (!this.personnelData.perPvdfQuitD) {
        this.personnelData.perPvdfQuitD = new Date().toISOString().substring(0, 10);
      }
    } else {
      // ปัจจุบันไม่ได้เป็นสมาชิก/ออกจากกองทุน -> กดปุ่มสีเขียว "➕ เป็นสมาชิกกองทุน" -> สลับเป็นสมาชิก
      this.personnelData.perPvdfQuit = null;
      this.personnelData.perPvdfQuitD = null;
      this.personnelData.notePvd = null;
      this.personnelData.perPvdfApp = 'Y';
      if (!this.personnelData.perPvdfAppD) {
        this.personnelData.perPvdfAppD = new Date().toISOString().substring(0, 10);
      }
    }
  }

  // ===================== Section 5 Checkbox Handlers =====================

  /** ตรวจสอบว่าประเภทบุคลากรอายุเกิน 60 ปี (TypeCode 10, 11) หรือไม่ */
  isSsoPaymentDisabled(): boolean {
    const code = Number(this.personnelData.typeCode);
    return code === 10 || code === 11;
  }

  /** เช็คว่า Checkbox ประกันสังคมติ๊กอยู่หรือไม่ */
  isSsoPaidChecked(): boolean {
    if (this.isSsoPaymentDisabled()) return false;
    return Number(this.personnelData.perSsoPayment) === 1;
  }

  /** ควบคุมการติ๊ก Checkbox ประกันสังคม */
  onSsoPaymentCheckboxChange(checked: boolean) {
    if (this.isSsoPaymentDisabled()) {
      this.personnelData.perSsoPayment = 3;
      return;
    }
    this.personnelData.perSsoPayment = checked ? 1 : 2;
  }

  /** สมาชิกกองทุน PVD — ติ๊ก = Y, เลิกติ๊ก = '' */
  onPvdfAppChange(checked: boolean) {
    this.personnelData.perPvdfApp = checked ? 'Y' : '';
    if (checked) {
      // ติ๊กสมาชิก → reset perPvdfQuit (ไม่เป็นสมาชิก)
      this.personnelData.perPvdfQuit = null;
      this.personnelData.perPvdfQuitD = null;
      this.personnelData.notePvd = null;
    } else {
      // เลิกเป็นสมาชิก → ล้างวันสมัครและกองทุน
      this.personnelData.perPvdfAppD = null;
      this.personnelData.perFundType = null;
    }
  }

  /** ไม่เป็นสมาชิกกองทุน PVD — ติ๊ก = 1, เลิกติ๊ก = null */
  onPvdfQuitChange(checked: boolean) {
    this.personnelData.perPvdfQuit = checked ? 1 : null;
    if (!checked) {
      this.personnelData.perPvdfQuitD = null;
      this.personnelData.notePvd = null;
    }
  }

  // ===================== Section 3 Financial Status Checkbox Handlers =====================

  /** ตรวจสอบว่า fRevSalary = 'Y' หรือไม่ */
  isFRevSalaryChecked(): boolean {
    return this.personnelData.fRevSalary === 'Y';
  }

  /** ตรวจสอบว่า fRevPosMoney = 'Y' หรือไม่ */
  isFRevPosMoneyChecked(): boolean {
    return this.personnelData.fRevPosMoney === 'Y';
  }

  /** ตรวจสอบว่า fRevPayEx = 'Y' หรือไม่ */
  isFRevPayExChecked(): boolean {
    return this.personnelData.fRevPayEx === 'Y';
  }

  /** ตรวจสอบว่า fTotalIncome = 'Y' หรือไม่ */
  isFTotalIncomeChecked(): boolean {
    return this.personnelData.fTotalIncome === 'Y';
  }

  // ฟังก์ชันสแกนข้อมูลและตรวจสอบฟิลด์บังคับ
  validateForm(): boolean {
    this.invalidFields = {};
    this.formMessage = null;
    let isValid = true;
    const isThai = this.nationality() === 'thai';

    if (isThai) {
      if (!this.personnelData.perCitizenId || this.personnelData.perCitizenId.trim().length !== 13) {
        this.invalidFields['perCitizenId'] = true;
        isValid = false;
      }
      if (!this.personnelData.preCode) {
        this.invalidFields['preCode'] = true;
        isValid = false;
      }
      if (!this.personnelData.perNameTh || !this.personnelData.perNameTh.trim()) {
        this.invalidFields['perNameTh'] = true;
        isValid = false;
      }
    } else {
      if (!this.personnelData.perPassportNo || !this.personnelData.perPassportNo.trim()) {
        this.invalidFields['perPassportNo'] = true;
        isValid = false;
      }
      if (!this.personnelData.preName || !this.personnelData.preName.trim()) {
        this.invalidFields['preName'] = true;
        isValid = false;
      }
      if (!this.personnelData.perFirstNameEn || !this.personnelData.perFirstNameEn.trim()) {
        this.invalidFields['perFirstNameEn'] = true;
        isValid = false;
      }
      if (!this.personnelData.perLastNameEn || !this.personnelData.perLastNameEn.trim()) {
        this.invalidFields['perLastNameEn'] = true;
        isValid = false;
      }
    }

    if (!this.personnelData.typeCode) {
      this.invalidFields['typeCode'] = true;
      isValid = false;
    }
    if (!this.personnelData.typeName || !this.personnelData.typeName.trim()) {
      this.invalidFields['typeName'] = true;
      isValid = false;
    }
    if (this.personnelData.perSalary === null || this.personnelData.perSalary === undefined || (this.personnelData.perSalary as any) === '' || Number(this.personnelData.perSalary) < 0) {
      this.invalidFields['perSalary'] = true;
      isValid = false;
    }
    if (this.personnelData.perHoldSalary === null || this.personnelData.perHoldSalary === undefined || (this.personnelData.perHoldSalary as any) === '' || Number(this.personnelData.perHoldSalary) < 0) {
      this.invalidFields['perHoldSalary'] = true;
      isValid = false;
    }

    return isValid;
  }

  // แสดงข้อความแจ้งเตือนแบบ banner
  private showMessage(type: 'success' | 'error', text: string) {
    if (type === 'success') {
      // ตั้งค่า global toast notification และปิดฟอร์มทันที signal ผ่าน services
      this.personnelService.notificationSignal.set({ type, message: text });
      this.personnelService.hasSearchedSignal.set(true);
      this.personnelService.editingPersonnel.set(null);
      this.personnelService.currentModeSignal.set('result');
      this.onCancel.emit();
      
      // ซ่อนข้อความแจ้งเตือน 3 วินาที
      setTimeout(() => {
        this.personnelService.notificationSignal.set(null);
      }, 3000);
    } else {
      // error ตรง banner ในฟอร์ม
      this.formMessage = { type, text };
    }
  }

  // บันทึกข้อมูล
  async saveData() {
    if (this.isLoading()) {
      return;
    }

    // ดักตรวจสอบความปลอดภัย: หากยังไม่มี Token ในเครื่อง และไม่ใช่ระบบจริง ให้ดำเนินการขอ Token ก่อนเริ่มเซฟข้อมูล
    if (!localStorage.getItem('token') && !environment.production) {
      const testCitizenId = '1234567890123';
      await this.personnelService.acquireToken(testCitizenId);
    }

    if (!this.validateForm()) {
      this.showMessage('error', 'กรุณากรอกข้อมูลในช่องบังคับ (*) ให้ครบถ้วน');
      this.cdr.detectChanges();
      setTimeout(() => {
        const firstErrorEl = document.querySelector('.field-input-error');
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (firstErrorEl as HTMLElement).focus();
        }
      }, 100);
      return;
    }

    // รวมชื่อ-นามสกุล ทั้งไทยและต่างชาติให้ตรงตามโครงสร้างข้อมูล
    const payload: any = { ...this.personnelData };
    if (this.nationality() === 'thai') {
      const first = (this.personnelData.perFirstNameTh || '').trim();
      const last = (this.personnelData.perLastNameTh || '').trim();
      payload.perNameTh = `${first} ${last}`.trim();
    } else {
      const parts = [
        payload.perFirstNameEn?.trim(),
        payload.perMiddleNameEn?.trim(),
        payload.perLastNameEn?.trim(),
      ].filter(s => s && s.length > 0);
      payload.perNameEn = parts.join(' ');
    }

    this.personnelService.loadingMessageSignal.set(
      this.isEditMode ? 'กำลังบันทึกการแก้ไขข้อมูล...' : 'กำลังบันทึกข้อมูลเข้าระบบ...'
    );
    this.personnelService.isLoadingSignal.set(true);

    try {
      if (this.isEditMode) {
        const original = this.personnelService.editingPersonnel();
        payload.originalCitizenId = original?.perCitizenId || null;
        payload.originalPassportNo = original?.perPassportNo || null;

        const response = await this.personnelService.updatePersonnel(payload);
        if (response && response.success) {
          // อัปเดตข้อมูลใน personnelListSignal ทันที เพื่อให้หน้าจอแสดงผลข้อมูลใหม่ทันที
          const currentList = this.personnelService.personnelListSignal();
          const targetCitizenId = payload.originalCitizenId || payload.perCitizenId;
          const targetPassportNo = payload.originalPassportNo || payload.perPassportNo;

          const updatedList = currentList.map(item => {
            const isMatch = (targetCitizenId && item.PER_CITIZEN_ID === targetCitizenId) ||
                            (targetPassportNo && item.PER_PASSPORT_NO === targetPassportNo);
            if (isMatch) {
              return {
                ...item,
                PER_CITIZEN_ID: payload.perCitizenId || item.PER_CITIZEN_ID,
                PER_PASSPORT_NO: payload.perPassportNo || item.PER_PASSPORT_NO,
                TYPE_CODE: payload.typeCode !== null && payload.typeCode !== undefined ? payload.typeCode : item.TYPE_CODE,
                TYPE_NAME: payload.typeName || item.TYPE_NAME,
                PER_SLIP_ID: payload.perSlipId || item.PER_SLIP_ID,
                PER_POS_ID: payload.perPosId !== null && payload.perPosId !== undefined ? payload.perPosId : item.PER_POS_ID,
                PRE_CODE: payload.preCode !== null && payload.preCode !== undefined ? payload.preCode : item.PRE_CODE,
                PRE_NAME: payload.preName || item.PRE_NAME,
                PER_NAME_TH: payload.perNameTh || item.PER_NAME_TH,
                PER_NAME_EN: payload.perNameEn || item.PER_NAME_EN,
                PER_MIDDLE_NAME_EN: payload.perMiddleNameEn ?? item.PER_MIDDLE_NAME_EN,
                PER_TAX_ID: payload.perTaxId || item.PER_TAX_ID,
                PER_PVDF_APP: payload.perPvdfApp || item.PER_PVDF_APP,
                PER_PVDF_APP_D: payload.perPvdfAppD || item.PER_PVDF_APP_D,
                PER_PVDF_QUIT: payload.perPvdfQuit !== undefined ? payload.perPvdfQuit : item.PER_PVDF_QUIT,
                PER_PVDF_QUIT_D: payload.perPvdfQuitD || item.PER_PVDF_QUIT_D,
                PER_FUND_TYPE: payload.perFundType !== null && payload.perFundType !== undefined ? payload.perFundType : item.PER_FUND_TYPE,
                PER_SAVE_RATE: payload.perSaveRate !== null && payload.perSaveRate !== undefined ? payload.perSaveRate : item.PER_SAVE_RATE,
                PER_SSO_PAYMENT: payload.perSsoPayment !== null && payload.perSsoPayment !== undefined ? payload.perSsoPayment : item.PER_SSO_PAYMENT,
                PER_FUND_TEACHER: payload.perFundTeacher !== null && payload.perFundTeacher !== undefined ? payload.perFundTeacher : item.PER_FUND_TEACHER,
                PER_FUND_ASSTEACHER: payload.perFundAssteacher !== null && payload.perFundAssteacher !== undefined ? payload.perFundAssteacher : item.PER_FUND_ASSTEACHER,
                PER_SSO_ID: payload.perSsoId || item.PER_SSO_ID,
                PER_PASSPORT_START_D: payload.perPassportStartD || item.PER_PASSPORT_START_D,
                PER_PASSPORT_EXPIRE_D: payload.perPassportExpireD || item.PER_PASSPORT_EXPIRE_D,
                POSC_NAME: payload.poscName || item.POSC_NAME,
                PER_FAC_C: payload.perFacC !== null && payload.perFacC !== undefined ? payload.perFacC : item.PER_FAC_C,
                FAC_NAME: payload.facName || item.FAC_NAME,
                PER_SALARY: payload.perSalary !== null && payload.perSalary !== undefined ? payload.perSalary : item.PER_SALARY,
                PER_HOLD_SALARY: payload.perHoldSalary !== null && payload.perHoldSalary !== undefined ? payload.perHoldSalary : item.PER_HOLD_SALARY,
                PER_SOURCE_MONEY: payload.perSourceMoney !== undefined ? payload.perSourceMoney : item.PER_SOURCE_MONEY,
                PER_POSITION_MONEY: payload.perPositionMoney !== undefined ? payload.perPositionMoney : item.PER_POSITION_MONEY,
                PER_POSITION_PAY: payload.perPositionPay !== undefined ? payload.perPositionPay : item.PER_POSITION_PAY,
                PER_POSITION_MONEY_EX: payload.perPositionMoneyEx !== undefined ? payload.perPositionMoneyEx : item.PER_POSITION_MONEY_EX,
                PER_POSITION_PAY_EX: payload.perPositionPayEx !== undefined ? payload.perPositionPayEx : item.PER_POSITION_PAY_EX,
                PER_PROJECT: payload.perProject !== undefined ? payload.perProject : item.PER_PROJECT,
                NOTE_PVD: payload.notePvd !== undefined ? payload.notePvd : item.NOTE_PVD,
                F_REV_SALARY: payload.fRevSalary || item.F_REV_SALARY,
                F_REV_POS_MONEY: payload.fRevPosMoney || item.F_REV_POS_MONEY,
                F_REV_PAY_EX: payload.fRevPayEx || item.F_REV_PAY_EX,
                F_TOTAL_INCOME: payload.fTotalIncome || item.F_TOTAL_INCOME,
              };
            }
            return item;
          });

          this.personnelService.personnelListSignal.set(updatedList);
          this.showMessage('success', response.message || 'แก้ไขข้อมูลบุคลากรเรียบร้อยแล้ว');
        }
      } else {
        const response = await this.personnelService.insertPersonnel(payload);
        if (response && response.success) {
          this.showMessage('success', response.message || 'บันทึกข้อมูลเข้าระบบเรียบร้อยแล้ว');
        }
      }
    } catch (err: any) {
      console.error(this.isEditMode ? 'Update Profile Fail:' : 'Insert Fail:', err);
      const defaultErr = this.isEditMode
        ? 'ไม่สามารถติดต่อฐานข้อมูลเพื่อแก้ไขประวัติได้'
        : 'ไม่สามารถติดต่อฐานข้อมูลเพื่อบันทึกข้อมูลใหม่ได้';
      const errMsg = err.error?.message || err.message || defaultErr;
      this.showMessage('error', errMsg);
    } finally {
      this.personnelService.isLoadingSignal.set(false);
    }
  }

  cancelForm() {
    this.onCancel.emit();
  }

  // ปิดโปรแกรมล้างค่าในจำสัญญาณ
  ngOnDestroy(): void {
    this.personnelService.editingPersonnel.set(null);
  }
}
