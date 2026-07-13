import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonnelResult } from './personnel-result';

describe('PersonnelResult', () => {
  let component: PersonnelResult;
  let fixture: ComponentFixture<PersonnelResult>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonnelResult],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonnelResult);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
