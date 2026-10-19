import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { environment } from '../../environment/environment';
import { PersonnelService } from '../services/personnel.service';

// ดึง token หลัง #
export function extractTokenFromAnywhere(route?: ActivatedRouteSnapshot): string | null {
  // จาก Angular route queryParams
  if (route?.queryParams && route.queryParams['token']) {
    return route.queryParams['token'];
  }

  if (typeof window !== 'undefined') {
    // จาก Browser URL search ก่อนเครื่องหมาย #
    if (window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get('token');
      if (token) return token;
    }

    // จาก Browser URL hash
    if (window.location.hash && window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.substring(window.location.hash.indexOf('?'));
      const hashParams = new URLSearchParams(hashQuery);
      const token = hashParams.get('token');
      if (token) return token;
    }
  }
  return null;
}

// Auth Guard ตรวจสอบสิทธิ์
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const personnelService = inject(PersonnelService);

  // ดักจับ Token จาก query parameter ทุกจุดบน URL
  const urlToken = extractTokenFromAnywhere(route);
  if (urlToken) {
    localStorage.setItem('token', urlToken);
    return true;
  }

  // Token บันทึกไว้ใน localStorage แล้ว และยังไม่หมดอายุ
  const savedToken = localStorage.getItem('token');
  if (savedToken && !personnelService.isTokenExpired(savedToken)) {
    return true;
  }

  // ไม่พบ Token หรือ Token หมดอายุ
  if (environment.production) {
    localStorage.removeItem('token');
    if (environment.portalLoginUrl && environment.portalLoginUrl.length > 8) {
      window.location.href = environment.portalLoginUrl;
    }
    return false;
  } else {
    // DEV Mode
    console.warn('AuthGuard: No token found in DEV mode');
    return true;
  }
};
