import { Component, inject } from '@angular/core';
import { PersonnelSearch } from './personnel-search/personnel-search';
import { PersonnelForm } from './personnel-form/personnel-form';
import { PersonnelResult } from './personnel-result/personnel-result';
import { NationalityToggle } from './nationality-toggle/nationality-toggle';
import { PersonnelService } from './services/services';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PersonnelSearch, PersonnelForm, PersonnelResult, NationalityToggle],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  private personnelService = inject(PersonnelService);
  
  currentMode = this.personnelService.currentModeSignal;
  hasSearched = this.personnelService.hasSearchedSignal;
  notification = this.personnelService.notificationSignal;

  switchMode(mode: 'result' | 'form') {
    this.personnelService.currentModeSignal.set(mode);
  }
}
