export interface CustomSelectOption {
  value: any;
  label: string;
  subLabel?: string;
  badge?: string;
  icon?: string;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  badge?: string;
  variant?: 'default' | 'danger' | 'warning' | 'primary';
  disabled?: boolean;
  dividerAfter?: boolean;
}

export type SkeletonVariant = 'rect' | 'text' | 'circle';
