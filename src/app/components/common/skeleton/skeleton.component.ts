import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonVariant } from '../../../models/ui.model';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton.component.html',
  styleUrls: ['./skeleton.component.css']
})
export class SkeletonComponent {
  @Input() variant: SkeletonVariant = 'rect';
  @Input() width: string = '100%';
  @Input() height: string = '20px';
  @Input() borderRadius?: string;
  @Input() count: number = 1;

  get countArray(): number[] {
    return Array.from({ length: Math.max(1, this.count) }, (_, i) => i);
  }

  get computedRadius(): string {
    if (this.borderRadius) return this.borderRadius;
    if (this.variant === 'circle') return '50%';
    if (this.variant === 'text') return '6px';
    return '10px';
  }
}
