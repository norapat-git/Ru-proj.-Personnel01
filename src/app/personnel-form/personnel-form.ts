import { Component, Output, EventEmitter, inject, OnInit, OnDestroy, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonnelService } from '../services/personnel.service';
import { ToastService } from '../services/toast.service';
import {
  CustomSelectOption,
  FacultyOption,
  FundTypeOption,
  PersonnelInsertInput,
  PersonTypeOption,
  PrenameOption,
  ProjectTypeOption,
  SourceMoneyOption,
} from '../models';
import { CustomSelectComponent } from '../components/common/custom-select/custom-select.component';
import { CustomDatePickerComponent } from '../components/common/custom-datepicker/custom-datepicker.component';
import { environment } from '../../environment/environment';

@Component({
  selector: 'app-personnel-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, CustomDatePickerComponent],
  templateUrl: './personnel-form.html',
  styleUrl: './personnel-form.css',
})
export class PersonnelForm implements OnInit, OnDestroy {
  @Output() onCancel = new EventEmitter<void>();

  private personnelService = inject(PersonnelService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  // ดึง nationality value from service
  nationality = this.personnelService.staffNationalitySignal;
  isLoading = this.personnelService.isLoadingSignal;
  isLoadingOptions = signal<boolean>(false);

  // form control logic
  isEditMode: boolean = false;

  // Stepper state for Create Mode (1-5)
  currentStep = signal<number>(1);
  maxReachedStep = signal<number>(1);
  isShaking = signal<boolean>(false);

  readonly steps = [
    { step: 1, title: 'ข้อมูลส่วนบุคคล', icon: 'badge', desc: 'เลขบัตร & ชื่อ-สกุล' },
    { step: 2, title: 'โครงสร้างตำแหน่ง', icon: 'domain', desc: 'สังกัดคณะ & ประเภท' },
    { step: 3, title: 'การเงินและรายได้', icon: 'payments', desc: 'เงินเดือน & สิทธิการรับเงิน' },
    { step: 4, title: 'กองทุนสำรองเลี้ยงชีพ', icon: 'savings', desc: 'กองทุน PVD' },
    { step: 5, title: 'สวัสดิการ & ตรวจสอบ', icon: 'health_and_safety', desc: 'ประกันสังคม & สรุป' },
  ];

  // popup result save
  formMessage: { type: 'success' | 'error'; text: string } | null = null;

  // โหลดจาก API FACULTY_CODE
  facultyOptions = signal<FacultyOption[]>([]);

  // โหลดจาก API PRENAME_CODE
  prenameOptions = signal<PrenameOption[]>([]);

  // โหลดจาก API PERSONTYPE
  personTypeOptions = signal<PersonTypeOption[]>([]);

  // โหลดจาก API FUND_TYPE
  fundTypeOptions = signal<FundTypeOption[]>([]);

  // โหลดจาก API PROJECT_TYPE
  projectTypeOptions = signal<ProjectTypeOption[]>([]);

  // โหลดจาก API SOURCE_MONEY
  sourceMoneyOptions = signal<SourceMoneyOption[]>([]);

  // ===================== Custom Select Computed Options =====================
  prenameSelectOptions = computed<CustomSelectOption[]>(() => {
    const isInter = this.nationality() === 'inter';
    return this.prenameOptions().map(p => {
      const val = isInter ? (p.preNameEn || p.preName) : p.preName;
      return {
        value: val,
        label: val,
        subLabel: isInter && p.preName ? p.preName : undefined,
        icon: 'badge'
      };
    });
  });

  facultySelectOptions = computed<CustomSelectOption[]>(() => {
    return this.facultyOptions().map(f => ({
      value: f.facName,
      label: f.facName,
      subLabel: f.facCode ? `รหัสคณะ: ${f.facCode}` : undefined,
      icon: 'school'
    }));
  });

  personTypeSelectOptions = computed<CustomSelectOption[]>(() => {
    return this.personTypeOptions().map(t => ({
      value: t.typeName,
      label: t.typeName,
      subLabel: t.typeCode ? `รหัสประเภท: ${t.typeCode}` : undefined,
      icon: 'group'
    }));
  });

  sourceMoneySelectOptions = computed<CustomSelectOption[]>(() => {
    return this.sourceMoneyOptions().map(sm => ({
      value: sm.smCode,
      label: sm.smName,
      subLabel: sm.smCode ? `รหัสแหล่งเงิน: ${sm.smCode}` : undefined,
      icon: 'account_balance_wallet'
    }));
  });

  projectTypeSelectOptions = computed<CustomSelectOption[]>(() => {
    return this.projectTypeOptions().map(p => ({
      value: p.proCode,
      label: p.proName,
      subLabel: p.proCode ? `รหัสโครงการ: ${p.proCode}` : undefined,
      icon: 'assignment'
    }));
  });

  fundTypeSelectOptions = computed<CustomSelectOption[]>(() => {
    return this.fundTypeOptions().map(f => ({
      value: f.fundName,
      label: f.fundName,
      subLabel: f.fundCode ? `รหัสกองทุน: ${f.fundCode}` : undefined,
      icon: 'savings'
    }));
  });

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

      // โหลดชื่อ-นามสกุลเข้าฟอร์ม
      this.personnelData.perNameTh = editPayload.perNameTh || '';
      this.personnelData.perNameEn = editPayload.perNameEn || '';
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
          console.error('Load person types failed:', err);
          return null;
        }),
        this.personnelService.getFundTypes().catch((err: any) => {
          console.error('Load fund types failed:', err);
          return null;
        }),
        this.personnelService.getProjectTypes().catch((err: any) => {
          console.error('Load project types failed:', err);
          return null;
        }),
        this.personnelService.getSourceMoneyTypes().catch((err: any) => {
          console.error('Load source moneys failed:', err);
          return null;
        }),
      ]);

      if (facRes?.success && facRes.data) {
        this.facultyOptions.set(facRes.data.map((row: any) => ({
          facCode: row.FAC_CODE,
          facName: row.FAC_NAME,
          facName2: row.FAC_NAME2,
        })));
      }

      if (preRes?.success && preRes.data) {
        this.prenameOptions.set(preRes.data.map((row: any) => ({
          preCode: row.PRE_CODE,
          preName: row.PRE_NAME,
          preName2: row.PRE_NAME2,
          preNameEn: row.PRE_NAME_EN,
        })));
      }

      if (typeRes?.success && typeRes.data) {
        this.personTypeOptions.set(typeRes.data.map((row: any) => ({
          typeCode: row.TYPE_CODE,
          typeName: row.TYPE_NAME,
          typeName2: row.TYPE_NAME2,
        })));
      }

      if (fundRes?.success && fundRes.data) {
        this.fundTypeOptions.set(fundRes.data.map((row: any) => ({
          fundCode: row.FUND_CODE,
          fundName: row.FUND_NAME,
        })));
      }

      if (projRes?.success && projRes.data) {
        this.projectTypeOptions.set(projRes.data.map((row: any) => ({
          proCode: row.PRO_CODE,
          proName: row.PRO_NAME,
        })));
      }

      if (moneyRes?.success && moneyRes.data) {
        this.sourceMoneyOptions.set(moneyRes.data.map((row: any) => ({
          smCode: row.SM_CODE,
          smName: row.SM_NAME,
        })));
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
    const found = this.prenameOptions().find(p => isInter ? (p.preNameEn === preNameText || p.preName === preNameText) : p.preName === preNameText);
    if (found) {
      this.personnelData.preCode = found.preCode;
      this.personnelData.preName = found.preName;
    } else {
      this.personnelData.preName = preNameText;
    }
    if (this.invalidFields['preName']) {
      this.invalidFields['preName'] = false;
    }
  }

  // ดึงชื่อประเภทบุคลากรสำหรับแสดงใน dropdown
  getSelectedPersonTypeName(): string {
    if (this.personnelData.typeName) return this.personnelData.typeName;
    if (this.personnelData.typeCode) {
      const found = this.personTypeOptions().find(t => t.typeCode === this.personnelData.typeCode);
      return found ? found.typeName : '';
    }
    return '';
  }

  // ดึงชื่อคณะสำหรับแสดงใน dropdown
  getSelectedFacultyName(): string {
    if (this.personnelData.facName) return this.personnelData.facName;
    if (this.personnelData.perFacC) {
      const found = this.facultyOptions().find(f => f.facCode === this.personnelData.perFacC);
      return found ? found.facName : '';
    }
    return '';
  }

  // เมื่อเลือกคณะออโต้ FAC_CODE ลงช่อง perFacC
  onFacultySelect(facName: string) {
    const found = this.facultyOptions().find(f => f.facName === facName);
    this.personnelData.facName = facName;
    this.personnelData.perFacC = found ? found.facCode : null;
    if (this.invalidFields['facName']) {
      this.invalidFields['facName'] = false;
    }
  }

  // drop down(PRENAME_CODE)
  onPreCodeSelect(code: number | null) {
    const numCode = code !== null && code !== undefined ? Number(code) : null;
    if (numCode) {
      this.personnelData.preCode = numCode;
      const found = this.prenameOptions().find(p => p.preCode === numCode);
      this.personnelData.preName = found ? found.preName : '';
    } else {
      this.personnelData.preCode = null;
      this.personnelData.preName = '';
    }
  }

  // dropdown PERSONTYPE เมื่อเลือก typeName แล้ว typeCode จะเปลี่ยนอัตโนมัติ
  onPersonTypeSelect(typeName: string) {
    const found = this.personTypeOptions().find(t => t.typeName === typeName);
    this.personnelData.typeName = typeName;
    this.personnelData.typeCode = found ? found.typeCode : null;
    if (this.invalidFields['typeName']) {
      this.invalidFields['typeName'] = false;
    }

    // ถ้า TypeCode เป็น 10 หรือ 11 ช่องประกันสังคมจะล็อกไม่ให้ชำระทันที (อายุเกิน 60 ปี)
    if (this.isSsoPaymentDisabled()) {
      this.personnelData.perSsoPayment = 3;
    } else if (this.personnelData.perSsoPayment === 3) {
      this.personnelData.perSsoPayment = 1;
    }
  }

  // dropdown FUND_TYPE เมื่อเลือก fundName แล้ว perFundType จะเปลี่ยนอัตโนมัติ
  onFundTypeSelect(fundName: string) {
    const found = this.fundTypeOptions().find(f => f.fundName === fundName);
    this.personnelData.perFundType = found ? found.fundCode : null;
  }

  // dropdown PROJECT_TYPE เมื่อเลือกประเภทโครงการที่ไม่ว่าง ให้เปลี่ยนแหล่งเงินทุนเป็น "เงินรายได้โครงการ" อัตโนมัติ
  onProjectTypeChange(proCode: any) {
    const code = proCode !== null && proCode !== undefined && proCode !== '' ? Number(proCode) : null;
    this.personnelData.perProject = code;

    // ถ้าเลือกเป็นอะไรสักอย่างที่ไม่เว้นว่าง แหล่งเงินทุน (Source Money) จะเปลี่ยนเป็น เงินรายได้โครงการอัตโนมัติ
    if (code !== null) {
      const targetSource = this.sourceMoneyOptions().find((sm) => {
        const name = sm.smName?.trim() || '';
        return (
          name === 'เงินรายได้โครงการ' ||
          name.includes('เงินรายได้โครงการ') ||
          name.includes('รายได้โครงการ') ||
          name.includes('โครงการ')
        );
      });

      if (targetSource) {
        this.personnelData.perSourceMoney = targetSource.smCode;
      }
    }
  }

  // helper: แปลง fundCode เป็น fundName สำหรับ [ngModel]
  getFundNameByCode(code: number | null): string {
    if (!code) return '';
    const found = this.fundTypeOptions().find(f => f.fundCode === code);
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

  // ===================== Multi-Step Wizard Controller (For Create Mode) =====================

  /** ตรวจสอบความถูกต้องของแต่ละ Step */
  validateStep(step: number): boolean {
    let isValid = true;
    const isThai = this.nationality() === 'thai';

    if (step === 1) {
      if (isThai) {
        if (!this.personnelData.perCitizenId || this.personnelData.perCitizenId.trim().length !== 13) {
          this.invalidFields['perCitizenId'] = true;
          isValid = false;
        } else {
          delete this.invalidFields['perCitizenId'];
        }
        if (!this.personnelData.preName) {
          this.invalidFields['preName'] = true;
          isValid = false;
        } else {
          delete this.invalidFields['preName'];
        }
        if (!this.personnelData.perNameTh || !this.personnelData.perNameTh.trim()) {
          this.invalidFields['perNameTh'] = true;
          isValid = false;
        } else {
          delete this.invalidFields['perNameTh'];
        }
      } else {
        if (!this.personnelData.perPassportNo || !this.personnelData.perPassportNo.trim()) {
          this.invalidFields['perPassportNo'] = true;
          isValid = false;
        } else {
          delete this.invalidFields['perPassportNo'];
        }
        if (!this.personnelData.preName || !this.personnelData.preName.trim()) {
          this.invalidFields['preName'] = true;
          isValid = false;
        } else {
          delete this.invalidFields['preName'];
        }
        if (!this.personnelData.perNameEn || !this.personnelData.perNameEn.trim()) {
          this.invalidFields['perNameEn'] = true;
          isValid = false;
        } else {
          delete this.invalidFields['perNameEn'];
        }
      }
    } else if (step === 2) {
      if (!this.personnelData.typeName || !this.personnelData.typeName.trim()) {
        this.invalidFields['typeName'] = true;
        isValid = false;
      } else {
        delete this.invalidFields['typeName'];
      }
      if (!this.personnelData.facName || !this.personnelData.facName.trim()) {
        this.invalidFields['facName'] = true;
        isValid = false;
      } else {
        delete this.invalidFields['facName'];
      }
    } else if (step === 3) {
      if (this.personnelData.perSalary === null || this.personnelData.perSalary === undefined || (this.personnelData.perSalary as any) === '' || Number(this.personnelData.perSalary) < 0) {
        this.invalidFields['perSalary'] = true;
        isValid = false;
      } else {
        delete this.invalidFields['perSalary'];
      }
      if (this.personnelData.perHoldSalary === null || this.personnelData.perHoldSalary === undefined || (this.personnelData.perHoldSalary as any) === '' || Number(this.personnelData.perHoldSalary) < 0) {
        this.invalidFields['perHoldSalary'] = true;
        isValid = false;
      } else {
        delete this.invalidFields['perHoldSalary'];
      }
    } else if (step === 4) {
      // Step 4 (PVD) Validation
      if (!this.isFundActiveMember() && this.personnelData.perPvdfQuit === 1 && !this.personnelData.perPvdfQuitD) {
        this.invalidFields['perPvdfQuitD'] = true;
        isValid = false;
      } else {
        delete this.invalidFields['perPvdfQuitD'];
      }
    }

    return isValid;
  }

  /** ไปขั้นตอนถัดไป */
  nextStep(): void {
    const current = this.currentStep();
    if (this.validateStep(current)) {
      this.formMessage = null;
      const next = Math.min(5, current + 1);
      this.currentStep.set(next);
      if (next > this.maxReachedStep()) {
        this.maxReachedStep.set(next);
      }
      this.scrollToTop();
    } else {
      this.triggerShake();
      this.showMessage('error', `กรุณากรอกข้อมูลที่จำเป็น (*) ในขั้นตอนที่ ${current} ให้ครบถ้วนก่อนไปต่อ`);
      this.focusFirstError();
    }
  }

  /** ย้อนกลับขั้นตอนก่อนหน้า */
  prevStep(): void {
    this.formMessage = null;
    this.currentStep.update(s => Math.max(1, s - 1));
    this.scrollToTop();
  }

  /** คลิกเลือก Step จาก Stepper Bar ด้านบน */
  goToStep(step: number): void {
    if (step === this.currentStep()) return;
    
    // หากย้อนกลับ อนุญาตเสมอ
    if (step < this.currentStep()) {
      this.formMessage = null;
      this.currentStep.set(step);
      this.scrollToTop();
      return;
    }

    // หากจะกระโดดไปข้างหน้า ต้องตรวจขั้นตอนก่อนหน้าทั้งหมดก่อน
    for (let s = this.currentStep(); s < step; s++) {
      if (!this.validateStep(s)) {
        this.triggerShake();
        this.showMessage('error', `กรุณากรอกข้อมูลในขั้นตอนที่ ${s} ให้ครบถ้วนก่อน`);
        this.focusFirstError();
        return;
      }
    }

    this.formMessage = null;
    this.currentStep.set(step);
    if (step > this.maxReachedStep()) {
      this.maxReachedStep.set(step);
    }
    this.scrollToTop();
  }

  /** Trigger Subtle Error Notice */
  triggerShake(): void {
    this.focusFirstError();
  }

  /** เลื่อนหน้าจอไปยังช่องที่ยังไม่กรอก แล้วสั่นช่องนั้นเบาๆ */
  focusFirstError(): void {
    this.cdr.detectChanges();
    setTimeout(() => {
      const invalidEls = document.querySelectorAll(
        '.field-input-error, .custom-select-container.is-invalid, .field-input-danger'
      );
      if (invalidEls.length > 0) {
        const firstEl = invalidEls[0];
        // เลื่อนจอไปที่ช่องแรกที่ยังไม่กรอกอย่างนุ่มนวล
        firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // สั่นเฉพาะช่องที่ยังไม่กรอกเบาๆ
        invalidEls.forEach((el) => {
          el.classList.remove('field-gentle-shake');
          // Trigger reflow
          void (el as HTMLElement).offsetWidth;
          el.classList.add('field-gentle-shake');
          setTimeout(() => el.classList.remove('field-gentle-shake'), 650);
        });

        if (firstEl instanceof HTMLElement) {
          firstEl.focus();
        }
      }
    }, 100);
  }

  /** เลื่อนหน้าจอกลับมาหัวฟอร์ม */
  scrollToTop(): void {
    setTimeout(() => {
      const container = document.querySelector('.form-container');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  }

  // ฟังก์ชันสแกนข้อมูลและตรวจสอบฟิลด์บังคับทั้งหมด (Final Full Check)
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
      if (!this.personnelData.perNameEn || !this.personnelData.perNameEn.trim()) {
        this.invalidFields['perNameEn'] = true;
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

  // แสดงข้อความแจ้งเตือน Toast และ Banner
  private showMessage(type: 'success' | 'error', text: string) {
    if (type === 'success') {
      const title = this.isEditMode ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มบุคลากรใหม่สำเร็จ';
      this.toastService.success(text, title);

      this.personnelService.hasSearchedSignal.set(true);
      this.personnelService.editingPersonnel.set(null);
      this.personnelService.currentModeSignal.set('result');
      this.onCancel.emit();
    } else {
      this.formMessage = { type, text };
      this.toastService.error(text, 'เกิดข้อผิดพลาด');
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

    payload.perNameTh = (this.personnelData.perNameTh || '').trim();
    payload.perNameEn = (this.personnelData.perNameEn || '').trim();

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
            const isMatch = (targetCitizenId && item.PER_CITIZEN_ID && String(item.PER_CITIZEN_ID).trim() === String(targetCitizenId).trim()) ||
                            (targetPassportNo && item.PER_PASSPORT_NO && String(item.PER_PASSPORT_NO).trim().toUpperCase() === String(targetPassportNo).trim().toUpperCase());
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
          this.showMessage('success', response.message || 'เพิ่มข้อมูลบุคลากรใหม่เข้าระบบเรียบร้อยแล้ว');
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
