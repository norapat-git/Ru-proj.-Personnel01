import { Component, inject, OnInit } from '@angular/core';
import { PersonnelSearch } from './personnel-search/personnel-search';
import { PersonnelForm } from './personnel-form/personnel-form';
import { PersonnelResult } from './personnel-result/personnel-result';
import { NationalityToggle } from './nationality-toggle/nationality-toggle';
import { PersonnelService } from './services/services';
import { environment } from '../environment/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PersonnelSearch, PersonnelForm, PersonnelResult, NationalityToggle],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements OnInit {
  private personnelService = inject(PersonnelService);
  
  currentMode = this.personnelService.currentModeSignal;
  hasSearched = this.personnelService.hasSearchedSignal;
  notification = this.personnelService.notificationSignal;

  ngOnInit(): void {
    //ขอ JWT Token เฉพาะขั้นตอนการพัฒนา (Development Mode)
    if (!environment.production) {
      const testCitizenId = '1234567890123';
      this.personnelService.acquireToken(testCitizenId);
    }
  }

  switchMode(mode: 'result' | 'form') {
    this.personnelService.currentModeSignal.set(mode);
  }
}
