import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonnelSearch } from './personnel-search';

describe('PersonnelSearch', () => {
  let component: PersonnelSearch;
  let fixture: ComponentFixture<PersonnelSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonnelSearch],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonnelSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
