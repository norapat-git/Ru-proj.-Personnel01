import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs'; // fix import firstValueFrom
import { environment } from '../environment/environment';
import { PersonnelDataResult, PersonnelInsertInput } from '../models/personnel';

@Service()
export class PersonnelService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  personnelListSignal = signal<PersonnelDataResult[]>([]);
  hasSearchedSignal = signal<boolean>(false);
  currentModeSignal = signal<'result' | 'form'>('result');
  editingPersonnel = signal<PersonnelInsertInput | null>(null);

  // สัญญาณแชร์สัญชาติ
  staffNationalitySignal = signal<'thai' | 'inter'>('thai');

  // สัญญาณสำหรับแจ้งเตือน
  notificationSignal = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  // ค้นหาข้อมูลบุคลากร
  searchPersonnel(type: string, keyword: string): Promise<any> {
    return firstValueFrom(this.http.get<any>(`${this.apiUrl}/search?type=${type}&keyword=${keyword}`));
  }

  // เพิ่มข้อมูลบุคลากรใหม่
  insertPersonnel(personData: PersonnelInsertInput): Promise<any> {
    return firstValueFrom(this.http.post(`${this.apiUrl}/insert`, personData));
  }

  // แก้ไขข้อมูล
  updatePersonnel(personData: PersonnelInsertInput): Promise<any> {
    return firstValueFrom(this.http.put(`${this.apiUrl}/update`, personData));
  }

  // ลบข้อมูล
  deletePersonnel(id: string): Promise<any> {
    return firstValueFrom(this.http.delete(`${this.apiUrl}/delete/${id}`));
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

}