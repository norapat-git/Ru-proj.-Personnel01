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
import { CustomSelectOption } from '../../../models/ui.model';

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ],
  templateUrl: './custom-select.component.html',
  styleUrls: ['./custom-select.component.css']
})
export class CustomSelectComponent implements ControlValueAccessor {
  @Input() set options(val: (CustomSelectOption | string | any)[]) {
    if (!val) {
      this._options.set([]);
      return;
    }
    // Normalize string[] or object[] into CustomSelectOption[]
    const normalized: CustomSelectOption[] = val.map(item => {
      if (typeof item === 'string') {
        return { value: item, label: item };
      }
      if (item && typeof item === 'object') {
        return {
          value: item.value ?? item.code ?? item.id ?? item.label ?? item,
          label: item.label ?? item.name ?? item.title ?? String(item.value ?? item),
          subLabel: item.subLabel ?? item.description,
          badge: item.badge,
          icon: item.icon
        };
      }
      return { value: item, label: String(item) };
    });
    this._options.set(normalized);
  }

  @Input() placeholder: string = 'เลือกรายการ...';
  @Input() searchable: boolean = true;
  @Input() allowClear: boolean = false;
  @Input() allowCustom: boolean = false;
  @Input() disabled: boolean = false;
  @Input() invalid: boolean = false;
  @Input() icon?: string;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  @Output() valueChange = new EventEmitter<any>();
  @Output() selectOption = new EventEmitter<CustomSelectOption>();

  private _options = signal<CustomSelectOption[]>([]);
  readonly rawOptions = this._options.asReadonly();

  isOpen = signal<boolean>(false);
  searchTerm = signal<string>('');
  selectedValue = signal<any>(null);

  filteredOptions = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const opts = this._options();
    if (!term) return opts;
    return opts.filter(
      opt =>
        opt.label.toLowerCase().includes(term) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(term)) ||
        (opt.badge && opt.badge.toLowerCase().includes(term))
    );
  });

  selectedOption = computed(() => {
    const val = this.selectedValue();
    if (val === null || val === undefined || val === '') return null;
    const found = this._options().find(o => o.value === val || o.label === val);
    if (found) return found;
    // If allowCustom and value not in list
    if (this.allowCustom && val) {
      return { value: val, label: String(val) };
    }
    return null;
  });

  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  toggleDropdown(): void {
    if (this.disabled) return;
    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown(): void {
    if (this.disabled) return;
    this.isOpen.set(true);
    this.searchTerm.set('');
  }

  closeDropdown(): void {
    this.isOpen.set(false);
    this.searchTerm.set('');
    this.onTouched();
  }

  chooseOption(opt: CustomSelectOption): void {
    this.selectedValue.set(opt.value);
    this.onChange(opt.value);
    this.valueChange.emit(opt.value);
    this.selectOption.emit(opt);
    this.closeDropdown();
  }

  chooseCustomText(): void {
    const text = this.searchTerm().trim();
    if (!text) return;
    this.selectedValue.set(text);
    const customOpt: CustomSelectOption = { value: text, label: text };
    this.onChange(text);
    this.valueChange.emit(text);
    this.selectOption.emit(customOpt);
    this.closeDropdown();
  }

  clearValue(event: MouseEvent): void {
    event.stopPropagation();
    this.selectedValue.set(null);
    this.onChange(null);
    this.valueChange.emit(null);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.isOpen()) {
        this.closeDropdown();
      }
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.closeDropdown();
    }
  }

  writeValue(val: any): void {
    this.selectedValue.set(val);
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
