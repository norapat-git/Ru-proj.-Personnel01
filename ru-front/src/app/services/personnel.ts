import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';
import { PersonnelDataResult, PersonnelInsertInput } from '../models/personnel';

@Injectable({
  providedIn: 'root',
})
export class PersonnelService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  personnelListSignal = signal<PersonnelDataResult[]>([]);
  hasSearchedSignal = signal<boolean>(false);
  currentModeSignal = signal<'result' | 'form'>('result');
  editingPersonnel = signal<PersonnelInsertInput | null>(null);

  // 🌟 เพิ่มสัญญาณแชร์สถานะสัญชาติบุคลากรระหว่าง Section (ค่าเริ่มต้นเป็น thai)
  // ตัวเลือก: 'thai' หรือ 'inter'
  staffNationalitySignal = signal<'thai' | 'inter'>('thai');

  // สัญญาณสำหรับแจ้งเตือนแบบ Toast/Banner ทั่วทั้งระบบ (แชร์สัญญานผ่าน Service)
  notificationSignal = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  searchPersonnel(type: string, keyword: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/search?type=${type}&keyword=${keyword}`);
  }

  insertPersonnel(personData: PersonnelInsertInput): Observable<any> {
    return this.http.post(`${this.apiUrl}/insert`, personData);
  }

  updatePersonnel(personData: PersonnelInsertInput): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, personData);
  }

  deletePersonnel(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }

  getFaculties(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/faculties`);
  }
}
