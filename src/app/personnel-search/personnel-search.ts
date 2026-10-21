import { Component, inject, effect, OnInit, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonnelService } from '../services/personnel.service';
import { NationalityToggle } from '../nationality-toggle/nationality-toggle';
import { CustomSelectOption } from '../models';
import { CustomSelectComponent } from '../components/common/custom-select/custom-select.component';
import { validateIDCard } from '../utils/thai-id-validator';

@Component({
  selector: 'app-personnel-search',
  standalone: true,
  imports: [CommonModule, FormsModule, NationalityToggle, CustomSelectComponent],
  templateUrl: './personnel-search.html',
  styleUrls: ['./personnel-search.css'],
})
export class PersonnelSearch implements OnInit {
  private personnelService = inject(PersonnelService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  nationality = this.personnelService.staffNationalitySignal;
  isLoading = this.personnelService.isLoadingSignal;
  hasSearched = this.personnelService.hasSearchedSignal;
  onOpenAdd = output<void>();

  filterType: string = 'idCard';
  singleKeyword: string = '';

  openAdd(): void {
    if (this.isLoading()) return;
    this.onOpenAdd.emit();
  }

  // ล็อค toggle เมื่อกำลังแสดงผลการค้นหา หรือ ดึงข้อมูลทั้งหมด
  isLocked = computed<boolean>(() => {
    return this.hasSearched();
  });

  filterOptions = computed<CustomSelectOption[]>(() => {
    if (this.nationality() === 'thai') {
      return [
        { value: 'idCard', label: 'เลขบัตรประชาชน (National ID)', icon: 'badge' },
        { value: 'nameTh', label: 'ชื่อจริง - นามสกุล (ภาษาไทย)', icon: 'person' },
      ];
    } else {
      return [
        { value: 'passport', label: 'เลขพาสปอร์ต (Passport ID)', icon: 'badge' },
        { value: 'ssoId', label: 'เลขประกันสังคม (SSO ID)', icon: 'verified_user' },
        { value: 'nameEn', label: 'ชื่อจริง - นามสกุล (English Name)', icon: 'person' },
      ];
    }
  });

  constructor() {
    effect(() => {
      const value = this.nationality();
      this.filterType = value === 'thai' ? 'idCard' : 'passport';
      this.singleKeyword = '';
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const searchKeyword = params['search_keyword']; 
      const searchType = params['search_type'];       

      if (searchKeyword) {
        const isInter = ['passport', 'ssoId', 'nameEn'].includes(searchType);
        this.personnelService.staffNationalitySignal.set(isInter ? 'inter' : 'thai');
        this.singleKeyword = searchKeyword;
        if (searchType) this.filterType = searchType;
        this.onSearchSubmit(false);
      }
    });
  }

  isNumericFilter(): boolean {
    return ['idCard', 'passport', 'ssoId'].includes(this.filterType);
  }

  /** ตรวจสอบว่าเลขบัตรประชาชนไม่ถูกต้องตามสูตรคำนวณ Checksum หรือไม่ (เมื่อกรอกครบ 13 หลัก) */
  isIdCardInvalid(): boolean {
    if (this.filterType === 'idCard' && this.singleKeyword && this.singleKeyword.trim().length === 13) {
      return !validateIDCard(this.singleKeyword.trim());
    }
    return false;
  }

  onKeywordInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.isNumericFilter()) {
      let cleaned = input.value.replace(/\D/g, '');
      if (this.filterType === 'idCard' || this.filterType === 'ssoId') {
        cleaned = cleaned.slice(0, 13);
      } else if (this.filterType === 'passport') {
        cleaned = cleaned.slice(0, 15);
      }
      this.singleKeyword = cleaned;
      input.value = cleaned;
    } else {
      this.singleKeyword = input.value;
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (this.isNumericFilter()) {
      if (!/^\d$/.test(event.key)) {
        event.preventDefault();
      }
    }
  }

  onFilterTypeChange(type: string): void {
    this.filterType = type;
    this.singleKeyword = '';
  }

  unlockSearch(): void {
    if (this.isLoading()) return;
    this.singleKeyword = '';
    this.personnelService.hasSearchedSignal.set(false);
    this.personnelService.personnelListSignal.set([]);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search_keyword: null,
        search_type: null
      },
      queryParamsHandling: 'merge'
    });
  }

  async loadAllPersonnel(): Promise<void> {
    if (this.isLoading()) {
      return;
    }
    this.personnelService.staffNationalitySignal.set('thai'); // แสดงเป็นภาษาไทยปกติ
    this.personnelService.hasSearchedSignal.set(true);
    this.personnelService.loadingMessageSignal.set('กำลังโหลดข้อมูลบุคลากร...');
    this.personnelService.isLoadingSignal.set(true);
    this.personnelService.personnelListSignal.set([]);
    try {
      this.personnelService.isFilteredSearchSignal.set(false);



      const response = await this.personnelService.searchPersonnel({ type: 'all', keyword: 'all' });

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
    } finally {
      this.personnelService.isLoadingSignal.set(false);
    }
  }

  async onSearchSubmit(isManual: boolean = true): Promise<void> {
    if (this.isLoading()) {
      return;
    }



    const finalKeyword = this.singleKeyword.trim();

    if (!finalKeyword) {
      if (isManual) {
        this.personnelService.showNotification('error', 'กรุณากรอกข้อมูลคำค้นหาก่อนทำรายการ', 3000);
      }
      return;
    }

    if (this.filterType === 'idCard') {
      if (finalKeyword.length !== 13) {
        if (isManual) {
          this.personnelService.showNotification('error', 'กรุณาระบุเลขบัตรประชาชนให้ครบ 13 หลัก', 3000);
        }
        return;
      }
      if (!validateIDCard(finalKeyword)) {
        if (isManual) {
          this.personnelService.showNotification('error', 'เลขประจำตัวประชาชนไม่ถูกต้องตามหลักเกณฑ์ (Checksum ไม่ถูกต้อง)', 3500);
        }
        return;
      }
    }

    if (this.filterType === 'ssoId' && finalKeyword.length !== 13) {
      if (isManual) {
        this.personnelService.showNotification('error', 'กรุณาระบุเลขประกันสังคมให้ครบ 13 หลัก', 3000);
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

    this.personnelService.hasSearchedSignal.set(true);
    this.personnelService.loadingMessageSignal.set('กำลังโหลดข้อมูลบุคลากร...');
    this.personnelService.isLoadingSignal.set(true);
    this.personnelService.personnelListSignal.set([]);
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
    } finally {
      this.personnelService.isLoadingSignal.set(false);
    }
  }
}
