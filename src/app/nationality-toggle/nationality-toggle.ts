import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonnelService } from '../services/personnel.service';

@Component({
  selector: 'app-nationality-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nationality-toggle.html',
  styleUrls: ['./nationality-toggle.css']
})
export class NationalityToggle {
  private personnelService = inject(PersonnelService);

  isLocked = input<boolean>(false);
  mode = input<'none' | 'thai' | 'inter' | 'all'>('none');
  onSelect = output<'thai' | 'inter'>();
  onUnlock = output<void>();

  nationality = this.personnelService.staffNationalitySignal;
  isLoading = this.personnelService.isLoadingSignal;

  setNationality(val: 'thai' | 'inter') {
    if (this.isLoading() || this.isLocked()) return;
    this.personnelService.staffNationalitySignal.set(val);
    this.onSelect.emit(val);
  }

  unlock() {
    if (this.isLoading()) return;
    this.onUnlock.emit();
  }
}
