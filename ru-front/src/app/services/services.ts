import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs'; // fix import firstValueFrom
import { PersonnelDataResult, PersonnelInsertInput } from '../models/personnel';
import { environment } from '../../environment/environment';

@Service()
export class PersonnelService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  personnelListSignal = signal<PersonnelDataResult[]>([]);
  hasSearchedSignal = signal<boolean>(false);
  isFilteredSearchSignal = signal<boolean>(false);
  currentModeSignal = signal<'result' | 'form'>('result');
  editingPersonnel = signal<PersonnelInsertInput | null>(null);

  // สัญญาณสถานะ Loading สำหรับการดึงข้อมูลจาก API
  isLoadingSignal = signal<boolean>(false);
  loadingMessageSignal = signal<string>('กำลังโหลดข้อมูลบุคลากร...');

  // สัญญาณแชร์สัญชาติ
  staffNationalitySignal = signal<'thai' | 'inter'>('thai');

  // สัญญาณสำหรับแจ้งเตือน
  notificationSignal = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  private notificationTimer: any = null;

  // showNotification 3s
  showNotification(type: 'success' | 'error', message: string, durationMs: number = 3000): void {
    this.notificationSignal.set({ type, message });
    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
    }
    if (durationMs > 0) {
      this.notificationTimer = setTimeout(() => {
        this.notificationSignal.set(null);
      }, durationMs);
    }
  }

  // ค้นหาข้อมูลบุคลากร
  searchPersonnel(object: any): Promise<any> {
    return firstValueFrom(this.http.post<any>(`${this.apiUrl}/search`, object));
  }

  // เพิ่มข้อมูลบุคลากรใหม่
  insertPersonnel(personData: PersonnelInsertInput): Promise<any> {
    return firstValueFrom(this.http.post(`${this.apiUrl}/insert`, personData));
  }

  // แก้ไขข้อมูล
  updatePersonnel(personData: PersonnelInsertInput): Promise<any> {
    return firstValueFrom(this.http.put(`${this.apiUrl}/update`, personData));
  }

  // ลบข้อมูลพร้อมส่งหมายเหตุการลบ (noteDel)
  deletePersonnel(id: string, noteDel?: string): Promise<any> {
    const encodedNote = noteDel ? encodeURIComponent(noteDel) : '';
    return firstValueFrom(
      this.http.delete(`${this.apiUrl}/delete/${id}?noteDel=${encodedNote}`, {
        body: { noteDel: noteDel || '', NOTE_DEL: noteDel || '' },
      })
    );
  }

  // fixx
  // ดึงรายชื่อคณะทั้งหมด
  getFaculties(): Promise<any> {
    return firstValueFrom(this.http.get<any>(`${this.apiUrl}/faculties`));
  }

  //  เรียกดูรายชื่อคำนำหน้า
  getPrenames(): Promise<any> {
    return firstValueFrom(this.http.get<any>(`${this.apiUrl}/prenames`));
  }

  // ดึงประเภทบุคลากรทั้งหมด
  getPersonTypes(): Promise<any> {
    return firstValueFrom(this.http.get<any>(`${this.apiUrl}/persontypes`));
  }

  // ดึงประเภทกองทุน
  getFundTypes(): Promise<any> {
    return firstValueFrom(this.http.get<any>(`${this.apiUrl}/fundtypes`));
  }

  // ดึงประเภทโครงการ
  getProjectTypes(): Promise<any> {
    return firstValueFrom(this.http.get<any>(`${this.apiUrl}/projecttypes`));
  }

  // ดึงประเภทแหล่งเงิน
  getSourceMoneyTypes(): Promise<any> {
    return firstValueFrom(this.http.get<any>(`${this.apiUrl}/sourcemoney`));
  }

  // ขอ Token จากเลขบัตรประชาชน บันทึกไว้ใน Local Storage
  async acquireToken(citizenId: string): Promise<any> {
    try {
      const signUrl = this.apiUrl.replace('/personnel', '/sign');
      const response = await firstValueFrom(
        this.http.post<any>(signUrl, { PER_CITIZEN_ID: citizenId })
      );
      if (response && response.success && response.token) {
        localStorage.setItem('token', response.token);
        return response.token;
      }
      return null;
    } catch (err: any) {
      console.warn('Acquire token background notice:', err);
      return null;
    }
  }

}