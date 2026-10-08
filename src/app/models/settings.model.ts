export interface UserSettings {
  // Notification & Toast
  enableSuccessToast: boolean;
  toastDurationMs: number; // 2500, 4000, 6000, 0 (manual)
  toastPosition: 'bottom-right' | 'top-right' | 'top-center';

  // Form & Workflow
  formLayoutMode: 'stepper' | 'single-page'; // 'stepper' (ทีละหัวข้อ - default) vs 'single-page' (หน้าเดียวทั้งหมด)

  // Display & Accessibility
  fontSizeScale: 'normal' | 'large'; // 100% vs 112%
  reduceMotion: boolean;

  // Workflow & Defaults
  defaultNationality: 'thai' | 'inter';
  confirmBeforeDelete: boolean;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  enableSuccessToast: true,
  toastDurationMs: 4000,
  toastPosition: 'bottom-right',
  formLayoutMode: 'stepper',
  fontSizeScale: 'normal',
  reduceMotion: false,
  defaultNationality: 'thai',
  confirmBeforeDelete: true
};
