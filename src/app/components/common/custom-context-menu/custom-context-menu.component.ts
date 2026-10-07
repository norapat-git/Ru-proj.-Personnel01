import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  HostListener,
  signal,
  computed,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextMenuItem } from '../../../models/ui.model';

@Component({
  selector: 'app-custom-context-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-context-menu.component.html',
  styleUrls: ['./custom-context-menu.component.css']
})
export class CustomContextMenuComponent {
  @Input() items: ContextMenuItem[] = [];
  @Input() headerTitle?: string;
  @Input() headerBadge?: string;

  @Input() set x(val: number) {
    this._x.set(val);
  }
  @Input() set y(val: number) {
    this._y.set(val);
  }
  @Input() set visible(val: boolean) {
    this._visible.set(val);
  }

  @Output() itemClick = new EventEmitter<ContextMenuItem>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('menuRef') menuRef?: ElementRef<HTMLDivElement>;

  private _x = signal<number>(0);
  private _y = signal<number>(0);
  private _visible = signal<boolean>(false);

  readonly isVisible = this._visible.asReadonly();

  // Adjust position so it doesn't clip viewport
  adjustedPosition = computed(() => {
    let rawX = this._x();
    let rawY = this._y();

    if (typeof window !== 'undefined') {
      const menuWidth = 220;
      const menuHeight = 260;
      if (rawX + menuWidth > window.innerWidth) {
        rawX = Math.max(10, window.innerWidth - menuWidth - 16);
      }
      if (rawY + menuHeight > window.innerHeight) {
        rawY = Math.max(10, window.innerHeight - menuHeight - 16);
      }
    }

    return { top: `${rawY}px`, left: `${rawX}px` };
  });

  constructor(private elementRef: ElementRef) {}

  onItemClick(item: ContextMenuItem, event: MouseEvent): void {
    event.stopPropagation();
    if (item.disabled) return;
    this.itemClick.emit(item);
    this.closeMenu();
  }

  closeMenu(): void {
    this._visible.set(false);
    this.close.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this._visible() && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  @HostListener('document:contextmenu', ['$event'])
  onDocumentContextMenu(event: MouseEvent): void {
    // If contextmenu occurs outside this component, close this menu
    if (this._visible() && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this._visible()) {
      this.closeMenu();
    }
  }
}
