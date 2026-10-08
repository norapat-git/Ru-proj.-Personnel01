import {
  Component,
  inject,
  HostListener,
  effect,
  signal,
  ElementRef,
  ViewChild,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TourService } from '../../../services/tour.service';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
}

interface PopoverPos {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right' | 'none';
}

@Component({
  selector: 'app-onboard-tour',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboard-tour.component.html',
  styleUrls: ['./onboard-tour.component.css']
})
export class OnboardTourComponent {
  private tourService = inject(TourService);
  private platformId = inject(PLATFORM_ID);

  @ViewChild('popoverCard') popoverCardRef?: ElementRef<HTMLDivElement>;

  readonly isActive = this.tourService.isActive;
  readonly currentStep = this.tourService.currentStep;
  readonly currentStepIndex = this.tourService.currentStepIndex;
  readonly totalSteps = this.tourService.totalSteps;
  readonly isFirstStep = this.tourService.isFirstStep;
  readonly isLastStep = this.tourService.isLastStep;
  readonly steps = this.tourService.steps;

  readonly targetRect = signal<Rect | null>(null);
  readonly popoverPos = signal<PopoverPos>({ top: 0, left: 0, arrowPosition: 'none' });

  private isBrowser = isPlatformBrowser(this.platformId);
  private rafId: number | null = null;

  constructor() {
    effect(() => {
      const active = this.isActive();
      const step = this.currentStep();
      if (active && step && this.isBrowser) {
        setTimeout(() => {
          this.updateTargetPosition();
        }, 50);
      }
    });
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  onWindowChange(): void {
    if (!this.isActive() || !this.isBrowser) return;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => {
      this.updateTargetPosition(false);
    });
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isActive()) return;

    if (event.key === 'Escape') {
      this.skip();
    } else if (event.key === 'ArrowRight' || event.key === 'Enter') {
      this.next();
    } else if (event.key === 'ArrowLeft') {
      this.prev();
    }
  }

  private updateTargetPosition(shouldScroll = true): void {
    const step = this.currentStep();
    if (!step) return;

    const el = document.querySelector(step.targetSelector) as HTMLElement | null;
    if (el) {
      if (shouldScroll) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }

      const rect = el.getBoundingClientRect();
      const padding = 8;
      
      let radius = 16;
      try {
        const computedStyle = window.getComputedStyle(el);
        const parsed = parseFloat(computedStyle.borderRadius);
        if (!isNaN(parsed)) {
          radius = Math.min(28, Math.max(12, parsed + 4));
        }
      } catch {}

      const targetR: Rect = {
        top: Math.max(0, rect.top - padding),
        left: Math.max(0, rect.left - padding),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        radius
      };

      this.targetRect.set(targetR);
      this.calculatePopoverPos(targetR, step.position || 'bottom');
    } else {
      // Fallback: center modal if target element not found
      this.targetRect.set(null);
      this.popoverPos.set({
        top: window.innerHeight / 2 - 140,
        left: Math.max(16, window.innerWidth / 2 - 190),
        arrowPosition: 'none'
      });
    }
  }

  private calculatePopoverPos(
    target: Rect,
    preferredPos: 'top' | 'bottom' | 'left' | 'right' | 'center'
  ): void {
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const cardW = Math.min(380, viewportW - 32);
    const cardH = 260; // Estimated height for positioning
    const margin = 14;

    let top = 0;
    let left = 0;
    let arrow: 'top' | 'bottom' | 'left' | 'right' | 'none' = 'top';

    // Mobile layout (< 640px): fixed bottom or top
    if (viewportW <= 640) {
      left = (viewportW - cardW) / 2;
      if (target.top > viewportH / 2) {
        top = Math.max(16, target.top - cardH - margin);
        arrow = 'bottom';
      } else {
        top = Math.min(viewportH - cardH - 16, target.top + target.height + margin);
        arrow = 'top';
      }
      this.popoverPos.set({ top, left, arrowPosition: arrow });
      return;
    }

    // Desktop positioning
    if (preferredPos === 'bottom') {
      top = target.top + target.height + margin;
      left = target.left + target.width / 2 - cardW / 2;
      arrow = 'top';

      // If bottom overflow, flip to top
      if (top + cardH > viewportH - 16) {
        top = Math.max(16, target.top - cardH - margin);
        arrow = 'bottom';
      }
    } else if (preferredPos === 'top') {
      top = target.top - cardH - margin;
      left = target.left + target.width / 2 - cardW / 2;
      arrow = 'bottom';

      // If top overflow, flip to bottom
      if (top < 16) {
        top = target.top + target.height + margin;
        arrow = 'top';
      }
    } else {
      top = target.top + target.height + margin;
      left = target.left + target.width / 2 - cardW / 2;
      arrow = 'top';
    }

    // Keep horizontally within viewport
    left = Math.max(16, Math.min(left, viewportW - cardW - 16));

    this.popoverPos.set({ top, left, arrowPosition: arrow });
  }

  next(): void {
    this.tourService.nextStep();
  }

  prev(): void {
    this.tourService.prevStep();
  }

  goTo(index: number): void {
    this.tourService.goToStep(index);
  }

  skip(): void {
    this.tourService.skipTour();
  }

  finish(): void {
    this.tourService.finishTour();
  }
}
