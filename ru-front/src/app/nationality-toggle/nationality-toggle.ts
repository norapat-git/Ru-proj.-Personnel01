import { Component, inject } from '@angular/core';
import { PersonnelService } from '../services/services';

@Component({
  selector: 'app-nationality-toggle',
  standalone: true,
  templateUrl: './nationality-toggle.html',
  styleUrls: ['./nationality-toggle.css']
})
export class NationalityToggle {
  private personnelService = inject(PersonnelService);

  // ดึงสัญญาณสัญชาติจากคลังกลาง
  nationality = this.personnelService.staffNationalitySignal;
  isLoading = this.personnelService.isLoadingSignal;

  setNationality(val: 'thai' | 'inter') {
    if (this.isLoading()) return;
    this.personnelService.staffNationalitySignal.set(val);
  }
}
