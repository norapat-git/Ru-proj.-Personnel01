import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { environment } from '../../environment/environment';
import { PersonnelService } from '../services/personnel.service';

// ดึง token หลัง # หรือก่อน # หรือจาก Angular route
export function extractTokenFromAnywhere(route?: ActivatedRouteSnapshot): string | null {
  // 1. จาก Angular route queryParams
  if (route?.queryParams && route.queryParams['token']) {
    return route.queryParams['token'];
  }

  // 2. จาก Browser URL
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
    sessionStorage.setItem('token', urlToken);
    return true;
  }

  // Token บันทึกไว้ใน sessionStorage แล้ว และยังไม่หมดอายุ
  const savedToken = sessionStorage.getItem('token');
  if (savedToken && !personnelService.isTokenExpired(savedToken)) {
    return true;
  }

  // ไม่พบ Token หรือ Token หมดอายุ
  const loginUrl = environment.portalLoginUrl && environment.portalLoginUrl.length > 8
    ? environment.portalLoginUrl
    : 'https://uat3.ru.ac.th';

  if (environment.production) {
    sessionStorage.removeItem('token');
    window.location.href = loginUrl;
    return false;
  } else {
    // DEV Mode
    console.warn('AuthGuard: No token found in DEV mode');
    return true;
  }
};
