import { Component, inject, effect, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonnelService } from '../services/services';
import { environment } from '../../environment/environment';

@Component({
  selector: 'app-personnel-search',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './personnel-search.html',
})
export class PersonnelSearch implements OnInit {
  private personnelService = inject(PersonnelService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  nationality = this.personnelService.staffNationalitySignal; // ดึงสัญญาณสัญชาติจากคลังกลาง
  filterType: string = 'idCard';
  singleKeyword: string = '';
  firstNameKeyword: string = '';
  middleNameKeyword: string = '';
  lastNameKeyword: string = '';

  constructor() {
    // เปลี่ยนเงื่อนไขการค้นหาตามสัญชาติอัตโนมัติ
    effect(() => {
      const value = this.nationality();
      this.filterType = value === 'thai' ? 'idCard' : 'passport';
      this.singleKeyword = '';
      this.firstNameKeyword = '';
      this.middleNameKeyword = '';
      this.lastNameKeyword = '';
    });
  }

  ngOnInit(): void {
    // ถ้ามี query params จาก URL (เช่น กลับมาจากหน้าอื่น) ให้ค้นหาตามนั้น
    this.route.queryParams.subscribe(params => {
      const searchKeyword = params['search_keyword']; 
      const searchType = params['search_type'];       
      const firstName = params['firstName'];         
      const lastName = params['lastName'];           

      if (searchKeyword) {
        this.singleKeyword = searchKeyword;
        if (searchType) this.filterType = searchType;
        this.onSearchSubmit(false);
      } else if (firstName || lastName) {
        this.firstNameKeyword = firstName || '';
        this.lastNameKeyword = lastName || '';
        this.filterType = 'nameTh';
        this.onSearchSubmit(false);
      }
    });
  }

  async loadAllPersonnel(): Promise<void> {
    try {
      this.personnelService.isFilteredSearchSignal.set(false);

      // Development mode: ต่ออายุ token ทุกครั้งที่กดเพื่อให้แน่ใจว่า token ยังใช้งานได้
      if (!environment.production) {
        const testCitizenId = '1234567890123';
        await this.personnelService.acquireToken(testCitizenId);
      }

      const response = await this.personnelService.searchPersonnel({ type: 'all', keyword: 'all' });
      console.log('[loadAllPersonnel] response:', response);

      this.personnelService.hasSearchedSignal.set(true);
      if (response && response.success && response.data) {
        this.personnelService.personnelListSignal.set(response.data);
        this.personnelService.showNotification('success', `โหลดข้อมูลบุคลากรทั้งหมด ${response.data.length} ราย`, 3000);
      } else {
        this.personnelService.personnelListSignal.set([]);
      }
    } catch (err: any) {
      console.error('[loadAllPersonnel] Error:', err);
      this.personnelService.hasSearchedSignal.set(true);
      this.personnelService.personnelListSignal.set([]);
      this.personnelService.showNotification('error', 'ไม่สามารถโหลดข้อมูลบุคลากรได้ กรุณาลองใหม่อีกครั้ง', 4000);
    }
  }


  //  fixx
  async onSearchSubmit(isManual: boolean = true): Promise<void> {
    // ดักตรวจสอบความปลอดภัย: หากยังไม่มี Token ในเครื่อง และไม่ใช่ระบบจริง (Development Mode) ให้ดำเนินการขอ Token ก่อนเริ่มยิงค้นหา
    if (!localStorage.getItem('token') && !environment.production) {
      const testCitizenId = '1234567890123';
      await this.personnelService.acquireToken(testCitizenId);
    }

    // finalKeyword เก็บค่าที่ค้นหา
    let finalKeyword = '';
    if (this.filterType === 'nameTh') {
      finalKeyword = `${this.firstNameKeyword} ${this.lastNameKeyword}`.trim();
    } else if (this.filterType === 'nameEn') {
      // รวมชื่อต้น + ชื่อกลาง (ถ้ามี) + นามสกุล
      const parts = [this.firstNameKeyword, this.middleNameKeyword, this.lastNameKeyword]
        .map(s => s.trim())
        .filter(s => s.length > 0);
      finalKeyword = parts.join(' ');
    } else {
      finalKeyword = this.singleKeyword.trim();
    }

    // Validation at Frontend: แสดงแจ้งเตือนเฉพาะเมื่อกดปุ่มค้นหาเอง (isManual = true)
    if (!finalKeyword) {
      if (isManual) {
        this.personnelService.showNotification('error', 'กรุณากรอกข้อมูลคำค้นหาก่อนทำรายการ', 3000);
      }
      return;
    }

    this.personnelService.isFilteredSearchSignal.set(true);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search_keyword: finalKeyword,
        search_type: this.filterType
      },
      queryParamsHandling: 'merge'
    });

    //  fixx
    try {
      const payload = {
        type: this.filterType,
        keyword: finalKeyword
      }
      const response = await this.personnelService.searchPersonnel(payload);
      this.personnelService.hasSearchedSignal.set(true);
      if (response && response.success && response.data) {
        this.personnelService.personnelListSignal.set(response.data);
      } else {
        this.personnelService.personnelListSignal.set([]);
      }
    } catch (err: any) {
      console.error('Search failed:', err);
      this.personnelService.hasSearchedSignal.set(true);
      this.personnelService.personnelListSignal.set([]);
    }
  }
}
