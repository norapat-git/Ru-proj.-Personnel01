import { Component, Output, EventEmitter, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PersonnelService } from '../services/services';
import { PersonnelInsertInput, PrenameOption, FacultyOption, PersonTypeOption, FundTypeOption } from '../models/personnel';

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

  // ดึง nationality value from service
  nationality = this.personnelService.staffNationalitySignal;

  // form control logic
  isEditMode: boolean = false;

  // popup result save
  formMessage: { type: 'success' | 'error'; text: string } | null = null;

  // ตัวเลือกตำแหน่งงาน
  positionOptions = [
    { value: 'ตำแหน่งงานที่ 1', label: 'ตำแหน่งงานที่ 1' },
    { value: 'ตำแหน่งงานที่ 2', label: 'ตำแหน่งงานที่ 2' },
    { value: 'ตำแหน่งงานที่ 3', label: 'ตำแหน่งงานที่ 3' },
    { value: 'ตำแหน่งงานที่ 4', label: 'ตำแหน่งงานที่ 4' },
    { value: 'ตำแหน่งงานที่ 5', label: 'ตำแหน่งงานที่ 5' },
    { value: 'ตำแหน่งงานที่ 6', label: 'ตำแหน่งงานที่ 6' },
  ];

  // โหลดจาก API FACULTY_CODE
  facultyOptions: FacultyOption[] = [];

  // โหลดจาก API PRENAME_CODE
  prenameOptions: PrenameOption[] = [];

  // โหลดจาก API PERSONTYPE
  personTypeOptions: PersonTypeOption[] = [];

  // โหลดจาก API FUND_TYPE
  fundTypeOptions: FundTypeOption[] = [];

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
    perPvdfQuit: '',
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
  };

  // ตรวจสอบข้อผิดพลาด input form
  invalidFields: { [key: string]: boolean } = {};

  // ตรวจสอบสถานะและหยอดข้อมูลเดิมเข้าช่องอินพุตอัตโนมัติเมื่อหน้าจอแบบฟอร์มเปิดตัวทำงาน
  ngOnInit(): void {
    // โหลดรายชื่อคณะจาก API เพื่อเติม dropdown
    this.personnelService.getFaculties().subscribe({
      next: (res: any) => {
        if (res?.success && res.data) {
          this.facultyOptions = res.data.map((row: any) => ({
            facCode: row.FAC_CODE,
            facName: row.FAC_NAME,
            facName2: row.FAC_NAME2,
          }));
        }
      },
      error: (err) => console.error('Load faculties failed:', err),
    });

    // โหลดรายชื่อคำนำหน้าชื่อจาก API เพื่อเติม dropdown
    this.personnelService.getPrenames().subscribe({
      next: (res: any) => {
        if (res?.success && res.data) {
          this.prenameOptions = res.data.map((row: any) => ({
            preCode: row.PRE_CODE,
            preName: row.PRE_NAME,
            preName2: row.PRE_NAME2,
            preNameEn: row.PRE_NAME_EN,
            preNameIdcard: row.PRE_NAME_IDCARD,
          }));
        }
      },
      error: (err) => console.error('Load prenames failed:', err),
    });

    // โหลดประเภทบุคลากรจาก API เพื่อเติม dropdown
    this.personnelService.getPersonTypes().subscribe({
      next: (res: any) => {
        if (res?.success && res.data) {
          this.personTypeOptions = res.data.map((row: any) => ({
            typeCode: row.TYPE_CODE,
            typeName: row.TYPE_NAME,
            typeName2: row.TYPE_NAME2,
          }));
        }
      },
      error: (err) => console.error('Load personTypes failed:', err),
    });

    // โหลดประเภทกองทุนจาก API เพื่อเติม dropdown
    this.personnelService.getFundTypes().subscribe({
      next: (res: any) => {
        if (res?.success && res.data) {
          this.fundTypeOptions = res.data.map((row: any) => ({
            fundCode: row.FUND_CODE,
            fundName: row.FUND_NAME,
          }));
        }
      },
      error: (err) => console.error('Load fundTypes failed:', err),
    });

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
    }
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
    if (this.personnelData.perSalary === null || this.personnelData.perSalary === undefined || this.personnelData.perSalary < 0) {
      this.invalidFields['perSalary'] = true;
      isValid = false;
    }

    return isValid;
  }

  // แสดงข้อความแจ้งเตือนแบบ banner
  private showMessage(type: 'success' | 'error', text: string) {
    if (type === 'success') {
      // ตั้งค่า global toast notification และปิดฟอร์มทันที signal ผ่าน services
      this.personnelService.notificationSignal.set({ type, message: text });
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
  saveData() {
    if (!this.validateForm()) {
      // scroll ขึ้นไปที่ field แรกที่ error
      const firstError = document.querySelector('.is-invalid');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // รวม First Name + Middle Name + Last Name เป็น perNameEn ช่องเดียว
    const payload: any = { ...this.personnelData };
    if (this.nationality() === 'inter') {
      const parts = [
        payload.perFirstNameEn?.trim(),
        payload.perMiddleNameEn?.trim(),
        payload.perLastNameEn?.trim(),
      ].filter(s => s && s.length > 0);
      payload.perNameEn = parts.join(' ');
    }

    if (this.isEditMode) {
      const original = this.personnelService.editingPersonnel();
      payload.originalCitizenId = original?.perCitizenId || null;
      payload.originalPassportNo = original?.perPassportNo || null;

      this.personnelService.updatePersonnel(payload).subscribe({
        next: (response: any) => {
          if (response && response.success) {
            this.showMessage('success', response.message || 'แก้ไขข้อมูลบุคลากรเรียบร้อยแล้ว');
          }
        },
        error: (err) => {
          console.error('Update Profile Fail:', err);
          const errMsg = err.error?.message || err.message || 'ไม่สามารถติดต่อฐานข้อมูลเพื่อแก้ไขประวัติได้';
          this.showMessage('error', errMsg);
        },
      });
    } else {
      this.personnelService.insertPersonnel(payload).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.showMessage('success', response.message || 'บันทึกข้อมูลเข้าระบบเรียบร้อยแล้ว');
          }
        },
        error: (err) => {
          console.error('Insert Fail:', err);
          const errMsg = err.error?.message || err.message || 'ไม่สามารถติดต่อฐานข้อมูลเพื่อบันทึกข้อมูลใหม่ได้';
          this.showMessage('error', errMsg);
        },
      });
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
