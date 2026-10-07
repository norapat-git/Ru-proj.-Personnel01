import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ElementRef,
  HostListener,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  dateString: string; // YYYY-MM-DD
}

export type CalendarViewMode = 'days' | 'months' | 'years';

@Component({
  selector: 'app-custom-datepicker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomDatePickerComponent),
      multi: true
    }
  ],
  templateUrl: './custom-datepicker.component.html',
  styleUrls: ['./custom-datepicker.component.css']
})
export class CustomDatePickerComponent implements ControlValueAccessor {
  @Input() placeholder: string = 'เลือกวันที่...';
  @Input() disabled: boolean = false;
  @Input() invalid: boolean = false;
  @Input() allowClear: boolean = true;
  @Input() minDate?: string; // YYYY-MM-DD
  @Input() maxDate?: string; // YYYY-MM-DD
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() placement: 'top' | 'bottom' = 'top'; // Default top (above the box)

  @Output() valueChange = new EventEmitter<string | null>();

  // Current selected value in YYYY-MM-DD format
  selectedValue = signal<string | null>(null);

  // Calendar view state
  viewDate = signal<Date>(new Date());
  isOpen = signal<boolean>(false);
  viewMode = signal<CalendarViewMode>('days');

  // Year range start for decade pagination in years mode (in CE, displayed as BE)
  yearPageStart = signal<number>(Math.floor(new Date().getFullYear() / 12) * 12);

  // Full Thai month names
  readonly monthNamesTh = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  // Short Thai month names
  readonly monthShortTh = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  // Thai Weekdays
  readonly weekDaysTh = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  // Current Month and Year label in Thai
  headerTitle = computed(() => {
    const d = this.viewDate();
    const mode = this.viewMode();
    const yearBe = d.getFullYear() + 543;
    const month = this.monthNamesTh[d.getMonth()];

    if (mode === 'years') {
      const startBe = this.yearPageStart() + 543;
      const endBe = startBe + 11;
      return `พ.ศ. ${startBe} - ${endBe}`;
    }

    if (mode === 'months') {
      return `พ.ศ. ${yearBe}`;
    }

    return `${month} ${yearBe}`;
  });

  // Display text formatted for input box (e.g. "19 ธันวาคม 2566")
  formattedDisplayValue = computed(() => {
    const val = this.selectedValue();
    if (!val) return '';
    try {
      const parts = val.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dateObj = new Date(y, m, d);
        if (!isNaN(dateObj.getTime())) {
          const monthName = this.monthNamesTh[m] || '';
          return `${d} ${monthName} ${y + 543}`;
        }
      }
      return val;
    } catch {
      return val;
    }
  });

  // 12 Years for the current page (in CE)
  yearsList = computed<number[]>(() => {
    const start = this.yearPageStart();
    const years: number[] = [];
    for (let i = 0; i < 12; i++) {
      years.push(start + i);
    }
    return years;
  });

  // Calendar Grid Days
  calendarDays = computed<CalendarDay[]>(() => {
    const currentView = this.viewDate();
    const year = currentView.getFullYear();
    const month = currentView.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 6 = Saturday
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const days: CalendarDay[] = [];
    const todayStr = this.formatDateToString(new Date());
    const selectedStr = this.selectedValue();

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dayNum);
      const str = this.formatDateToString(d);
      days.push({
        date: d,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: str === todayStr,
        isSelected: str === selectedStr,
        dateString: str
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const str = this.formatDateToString(d);
      days.push({
        date: d,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: str === todayStr,
        isSelected: str === selectedStr,
        dateString: str
      });
    }

    // Next month padding to fill complete weeks
    const fillCount = (7 - (days.length % 7)) % 7;
    for (let dayNum = 1; dayNum <= fillCount; dayNum++) {
      const d = new Date(year, month + 1, dayNum);
      const str = this.formatDateToString(d);
      days.push({
        date: d,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: str === todayStr,
        isSelected: str === selectedStr,
        dateString: str
      });
    }

    return days;
  });

  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  togglePicker(): void {
    if (this.disabled) return;
    if (this.isOpen()) {
      this.closePicker();
    } else {
      this.openPicker();
    }
  }

  openPicker(): void {
    if (this.disabled) return;
    // Align viewDate to selectedValue if available
    const val = this.selectedValue();
    if (val) {
      const parts = val.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const parsed = new Date(y, m, d);
        if (!isNaN(parsed.getTime())) {
          this.viewDate.set(new Date(y, m, 1));
          this.yearPageStart.set(Math.floor(y / 12) * 12);
        }
      }
    } else {
      const currYear = new Date().getFullYear();
      this.yearPageStart.set(Math.floor(currYear / 12) * 12);
    }
    this.viewMode.set('days');
    this.isOpen.set(true);
  }

  closePicker(): void {
    this.isOpen.set(false);
    this.viewMode.set('days');
    this.onTouched();
  }

  toggleViewMode(e: MouseEvent): void {
    e.stopPropagation();
    const current = this.viewMode();
    if (current === 'days') {
      const y = this.viewDate().getFullYear();
      this.yearPageStart.set(Math.floor(y / 12) * 12);
      this.viewMode.set('years');
    } else if (current === 'years') {
      this.viewMode.set('months');
    } else {
      this.viewMode.set('days');
    }
  }

  prevAction(e: MouseEvent): void {
    e.stopPropagation();
    const mode = this.viewMode();
    if (mode === 'days') {
      const d = this.viewDate();
      this.viewDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    } else if (mode === 'years') {
      this.yearPageStart.update(y => y - 12);
    } else if (mode === 'months') {
      const d = this.viewDate();
      this.viewDate.set(new Date(d.getFullYear() - 1, d.getMonth(), 1));
    }
  }

  nextAction(e: MouseEvent): void {
    e.stopPropagation();
    const mode = this.viewMode();
    if (mode === 'days') {
      const d = this.viewDate();
      this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    } else if (mode === 'years') {
      this.yearPageStart.update(y => y + 12);
    } else if (mode === 'months') {
      const d = this.viewDate();
      this.viewDate.set(new Date(d.getFullYear() + 1, d.getMonth(), 1));
    }
  }

  selectYear(year: number, e: MouseEvent): void {
    e.stopPropagation();
    const d = this.viewDate();
    this.viewDate.set(new Date(year, d.getMonth(), 1));
    this.viewMode.set('months');
  }

  selectMonth(monthIndex: number, e: MouseEvent): void {
    e.stopPropagation();
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), monthIndex, 1));
    this.viewMode.set('days');
  }

  selectDay(day: CalendarDay, e: MouseEvent): void {
    e.stopPropagation();
    if (this.disabled) return;
    this.selectedValue.set(day.dateString);
    this.onChange(day.dateString);
    this.valueChange.emit(day.dateString);
    this.closePicker();
  }

  setToday(e: MouseEvent): void {
    e.stopPropagation();
    const today = new Date();
    const todayStr = this.formatDateToString(today);
    this.selectedValue.set(todayStr);
    this.viewDate.set(new Date(today.getFullYear(), today.getMonth(), 1));
    this.viewMode.set('days');
    this.onChange(todayStr);
    this.valueChange.emit(todayStr);
    this.closePicker();
  }

  clearValue(e: MouseEvent): void {
    e.stopPropagation();
    this.selectedValue.set(null);
    this.onChange(null);
    this.valueChange.emit(null);
  }

  private formatDateToString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.isOpen()) {
        this.closePicker();
      }
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.closePicker();
    }
  }

  // ControlValueAccessor implementation
  writeValue(val: any): void {
    if (val) {
      const str = String(val).substring(0, 10);
      this.selectedValue.set(str);
      const parts = str.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        this.viewDate.set(new Date(y, m, 1));
        this.yearPageStart.set(Math.floor(y / 12) * 12);
      }
    } else {
      this.selectedValue.set(null);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
