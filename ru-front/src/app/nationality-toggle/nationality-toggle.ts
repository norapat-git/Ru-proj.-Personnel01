import { Component, inject } from '@angular/core';
import { PersonnelService } from '../services/personnel';

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

  setNationality(val: 'thai' | 'inter') {
    this.personnelService.staffNationalitySignal.set(val);
  }
}
