export interface TourStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  badge?: string;
  icon?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}
