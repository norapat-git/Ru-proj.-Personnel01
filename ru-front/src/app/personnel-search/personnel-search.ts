import { Component, inject, effect, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonnelService } from '../services/services';

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

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const searchKeyword = params[' ']; 
      const searchType = params[' '];       
      const firstName = params[' '];         
      const lastName = params[' '];           
      const facName = params['FAC_NAME'];             

      if (searchKeyword) {
        this.singleKeyword = searchKeyword;
        if (searchType) this.filterType = searchType;
        this.onSearchSubmit();
      } else if (firstName || lastName) {
        this.firstNameKeyword = firstName || '';
        this.lastNameKeyword = lastName || '';
        this.filterType = 'nameTh';
        this.onSearchSubmit();
      } else if (facName) {
        console.log('FAC_NAME from URL:', facName);
      }
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

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search_keyword: finalKeyword,
        search_type: this.filterType
      },
      queryParamsHandling: 'merge'
    });

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
