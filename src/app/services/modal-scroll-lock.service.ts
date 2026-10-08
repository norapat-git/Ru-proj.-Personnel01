import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModalScrollLockService {
  private activeModalsCount = signal<number>(0);

  /**
   * ล็อกการ Scroll ของหน้าจอด้านหลัง (Lock Body Scroll) เมื่อเปิด Modal / Popup
   */
  lock(): void {
    const current = this.activeModalsCount();
    this.activeModalsCount.set(current + 1);
    this.updateBodyClass();
  }

  /**
   * ปลดล็อกการ Scroll ของหน้าจอด้านหลัง (Unlock Body Scroll) เมื่อปิด Modal / Popup
   */
  unlock(): void {
    const current = this.activeModalsCount();
    if (current > 0) {
      this.activeModalsCount.set(current - 1);
    }
    this.updateBodyClass();
  }

  /**
   * ปลดล็อกทั้งหมดเพื่อความปลอดภัย (Reset All Locks)
   */
  reset(): void {
    this.activeModalsCount.set(0);
    this.updateBodyClass();
  }

  private updateBodyClass(): void {
    if (typeof document === 'undefined') return;

    if (this.activeModalsCount() > 0) {
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    }
  }
}
