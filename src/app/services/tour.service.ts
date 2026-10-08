import { Injectable, signal, computed, inject } from '@angular/core';
import { TourStep } from '../models/tour.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class TourService {
  private toastService = inject(ToastService);
  readonly STORAGE_KEY = 'ru_personnel_tour_v1';

  readonly steps: TourStep[] = [
    {
      id: 'step-welcome',
      targetSelector: '.app-header',
      badge: 'ยินดีต้อนรับ',
      icon: 'waving_hand',
      title: 'ระบบจัดการข้อมูลบุคลากรรับฝาก',
      description: 'ยินดีต้อนรับสู่ระบบบริหารจัดการและสืบค้นข้อมูลบุคลากร มหาวิทยาลัยรามคำแหง ที่ได้รับการออกแบบให้ใช้งานง่ายและรวดเร็ว',
      position: 'bottom'
    },
    {
      id: 'step-nationality',
      targetSelector: '.nationality-toggle-container',
      badge: 'สลับสัญชาติ',
      icon: 'swap_horiz',
      title: 'สลับประเภทบุคลากร (ไทย / ต่างชาติ)',
      description: 'คลิกสลับเพื่อเลือกค้นหาและจัดการข้อมูลระหว่าง "บุคลากรชาวไทย" หรือ "บุคลากรต่างชาติ" ระบบจะปรับเปลี่ยนฟิลด์และเงื่อนไขให้อัตโนมัติ',
      position: 'bottom'
    },
    {
      id: 'step-search-input',
      targetSelector: '.search-inputs-wrapper',
      badge: 'ค้นหาข้อมูล',
      icon: 'search',
      title: 'เงื่อนไขและช่องค้นหาข้อมูล',
      description: 'เลือกเงื่อนไข (เลขบัตรประชาชน, เลขพาสปอร์ต, ประกันสังคม หรือชื่อ-สกุล) แล้วกรอกคำค้นหา สามารถกดปุ่ม Enter บนคีย์บอร์ดเพื่อค้นหาได้ทันที',
      position: 'bottom'
    },
    {
      id: 'step-search-actions',
      targetSelector: '.search-actions-row',
      badge: 'ปุ่มคำสั่ง',
      icon: 'group',
      title: 'ค้นหา & แสดงข้อมูลทุกคน',
      description: 'กด "ค้นหาข้อมูล" เพื่อค้นหาตามเงื่อนไข หรือกด "แสดงข้อมูลบุคลากรทุกคน" เพื่อดึงรายชื่อบุคลากรทั้งหมดในระบบมาแสดงผลทันที',
      position: 'top'
    },
    {
      id: 'step-add-personnel',
      targetSelector: '#tour-add-btn',
      badge: 'เพิ่มบุคลากร',
      icon: 'person_add',
      title: 'เพิ่มข้อมูลบุคลากรใหม่',
      description: 'กดปุ่มนี้เพื่อเปิดหน้าต่างสร้างรายการบุคลากรใหม่ เลือกสัญชาติ และกรอกแบบฟอร์มบันทึกเข้าสู่ฐานข้อมูล',
      position: 'bottom'
    }
  ];

  readonly isActive = signal<boolean>(false);
  readonly currentStepIndex = signal<number>(0);

  readonly currentStep = computed(() => {
    const idx = this.currentStepIndex();
    return this.steps[idx] || null;
  });

  readonly totalSteps = computed(() => this.steps.length);
  readonly isFirstStep = computed(() => this.currentStepIndex() === 0);
  readonly isLastStep = computed(() => this.currentStepIndex() === this.steps.length - 1);

  /**
   * ตรวจสอบว่าผู้ใช้เคยดูทัวร์หรือยังผ่าน LocalStorage
   */
  hasSeenTour(): boolean {
    try {
      return localStorage.getItem(this.STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * เริ่มการแสดงทัวร์
   * @param force ถ้าเป็น true จะเปิดทัวร์ทันทีแม้จะเคยดูแล้ว (ใช้เมื่อผู้ใช้กดปุ่มแนะนำการใช้งาน)
   */
  startTour(force: boolean = false): void {
    if (!force && this.hasSeenTour()) {
      return;
    }

    this.currentStepIndex.set(0);
    this.isActive.set(true);
  }

  nextStep(): void {
    if (this.isLastStep()) {
      this.finishTour();
    } else {
      this.currentStepIndex.update(idx => idx + 1);
    }
  }

  prevStep(): void {
    if (!this.isFirstStep()) {
      this.currentStepIndex.update(idx => idx - 1);
    }
  }

  goToStep(index: number): void {
    if (index >= 0 && index < this.steps.length) {
      this.currentStepIndex.set(index);
    }
  }

  skipTour(): void {
    this.markTourAsCompleted();
    this.isActive.set(false);
  }

  finishTour(): void {
    this.markTourAsCompleted();
    this.isActive.set(false);
    this.toastService.success(
      'คุณสามารถกดปุ่ม "แนะนำการใช้งาน" ที่มุมขวาบนเพื่อดูคำแนะนำซ้ำได้เสมอ',
      'พร้อมเริ่มต้นใช้งานแล้ว!'
    );
  }

  private markTourAsCompleted(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, 'true');
    } catch (e) {
      console.warn('Cannot write to localStorage', e);
    }
  }

  /**
   * รีเซ็ตสถานะการดูทัวร์ (สำหรับกรณีต้องการทดสอบ)
   */
  resetTourStatus(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.warn('Cannot clear localStorage', e);
    }
  }
}
