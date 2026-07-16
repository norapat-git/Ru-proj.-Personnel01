import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  getPrenames(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/prenames`);
  }

  getPersonTypes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/persontypes`);
  }

  getFundTypes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/fundtypes`);
  }

}