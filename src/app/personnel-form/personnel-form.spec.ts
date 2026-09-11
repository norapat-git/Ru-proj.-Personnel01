import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonnelForm } from './personnel-form';

describe('PersonnelForm', () => {
  let component: PersonnelForm;
  let fixture: ComponentFixture<PersonnelForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonnelForm],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonnelForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
