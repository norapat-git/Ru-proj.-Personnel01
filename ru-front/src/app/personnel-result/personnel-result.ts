import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common'; //ฟอร์แมตตัวเลขและเงินเดือน
import { PersonnelService } from '../services/services';

@Component({
  selector: 'app-personnel-result',
  standalone: true,
  imports: [DecimalPipe], //DecimalPipe ตัดทศนิยมเงินเดือนหน้าจอ
  templateUrl: './personnel-result.html',
})
export class PersonnelResult {
  private personnelService = inject(PersonnelService);

  personnelList = this.personnelService.personnelListSignal;

  // สัญญาณแชร์สัญชาติ
  nationality = this.personnelService.staffNationalitySignal;

  // สำหรับการเปิด Modal ยืนยันการลบ
  deleteTargetId: string | null = null;

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
      perPvdfApp: rawSelection.PER_PVDF_APP,
      // ตัดความยาวสตริงวันที่ให้เหลือ 10 หลัก
      perPvdfAppD: rawSelection.PER_PVDF_APP_D
        ? rawSelection.PER_PVDF_APP_D.substring(0, 10)
        : null,
      perPvdfQuit: rawSelection.PER_PVDF_QUIT,
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
    });

    // สลับหน้าจอพื้นที่ส่วนล่างให้เปลี่ยนมาโชว์หน้าแบบฟอร์ม
    this.personnelService.currentModeSignal.set('form');
  }

  // ฟังก์ชันกดลบข้อมูลจากขอบด้านล่างของแผงรายละเอียด Card
  triggerDelete(targetCitizenId: string): void {
    this.deleteTargetId = targetCitizenId;
  }

  cancelDelete(): void {
    this.deleteTargetId = null;
  }

  // fixx
  async confirmDelete(): Promise<void> {
    const targetId = this.deleteTargetId;
    if (!targetId) return;

    // fixx
    try {
      const res = await this.personnelService.deletePersonnel(targetId);
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
    } catch (err: any) {
      console.error('Delete Error:', err);
      this.personnelService.notificationSignal.set({ 
        type: 'error', 
        message: 'ไม่สามารถลบข้อมูลได้ เนื่องจากระบบเชื่อมต่อฐานข้อมูลขัดข้อง' 
      });
      setTimeout(() => this.personnelService.notificationSignal.set(null), 3000);
      this.deleteTargetId = null;
    }
  }
}
