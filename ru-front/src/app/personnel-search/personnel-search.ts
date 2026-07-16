import { Component, inject, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PersonnelService } from '../services/personnel';

@Component({
  selector: 'app-personnel-search',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './personnel-search.html',
})
export class PersonnelSearch {
  private personnelService = inject(PersonnelService);

  nationality = this.personnelService.staffNationalitySignal; // ดึงสัญญาณสัญชาติจากคลังกลาง
  filterType: string = 'idCard';
  singleKeyword: string = '';
  firstNameKeyword: string = '';
  middleNameKeyword: string = '';
  lastNameKeyword: string = '';

  constructor() {
    // ซิงค์การเปลี่ยนเงื่อนไขการค้นหาตามประเภทสัญชาติโดยอัตโนมัติ
    effect(() => {
      const value = this.nationality();
      this.filterType = value === 'thai' ? 'idCard' : 'passport';
      this.singleKeyword = '';
      this.firstNameKeyword = '';
      this.middleNameKeyword = '';
      this.lastNameKeyword = '';
    });
  }

  onSearchSubmit(): void {
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

    this.personnelService.searchPersonnel(this.filterType, finalKeyword).subscribe({
      next: (response: any) => {
        this.personnelService.hasSearchedSignal.set(true);
        if (response && response.success && response.data) {
          this.personnelService.personnelListSignal.set(response.data);
        } else {
          this.personnelService.personnelListSignal.set([]);
        }
      },
      error: (err: any) => {
        console.error('Search failed:', err);
        this.personnelService.hasSearchedSignal.set(true);
        this.personnelService.personnelListSignal.set([]);
      }
    });
  }
}
