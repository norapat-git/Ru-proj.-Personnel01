import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { environment } from '../../environment/environment';
import { PersonnelService } from '../services/personnel.service';

// ดึง Identifier จาก Parameter ใน URL (รองรับทั้ง uid, userId, userid, client_id)
export function extractTokenFromAnywhere(route?: ActivatedRouteSnapshot): string | null {
  const allowedKeys = ['uid', 'userId', 'userid', 'client_id', 'id', 'PER_CITIZEN_ID'];

  if (route?.queryParams) {
    for (const key of allowedKeys) {
      if (route.queryParams[key]) return route.queryParams[key];
    }
  }

  if (typeof window !== 'undefined') {
    if (window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      for (const key of allowedKeys) {
        const val = searchParams.get(key);
        if (val) return val;
      }
    }

    if (window.location.hash && window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.substring(window.location.hash.indexOf('?'));
      const hashParams = new URLSearchParams(hashQuery);
      for (const key of allowedKeys) {
        const val = hashParams.get(key);
        if (val) return val;
      }
    }
  }
  return null;
}

// Auth Guard ตรวจสอบสิทธิ์
export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const personnelService = inject(PersonnelService);

  // 1. ตรวจสอบว่ามี JWT Token อยู่ใน sessionStorage และยังไม่หมดอายุหรือไม่
  const savedToken = sessionStorage.getItem('token');
  if (savedToken && !personnelService.isTokenExpired(savedToken)) {
    return true;
  }

  // 2. หากยังไม่มี Token ในเครื่อง:
  // กรณีมี uid ส่งมาใน URL ให้ส่ง uid ไปขอ JWT Token จาก /sign
  const uid = extractTokenFromAnywhere(route);
  if (uid) {
    const newToken = await personnelService.sign(uid);
    if (newToken) {
      return true;
    }
  }

  // 3. กรณี DEV Mode ให้ขอ JWT Token อัตโนมัติด้วยเลขบัตรประชาชนทดสอบ
  if (!environment.production) {
    const testCitizenId = '1234567890123';
    const devToken = await personnelService.sign(testCitizenId);
    if (devToken) {
      return true;
    }
    console.warn('AuthGuard: No token found in DEV mode');
    return true;
  }

  // 4. กรณี Production Mode: ไม่มี Token และขอไม่ได้ ให้ Redirect ไปหน้า Portal
  sessionStorage.removeItem('token');
  const loginUrl = environment.portalLoginUrl && environment.portalLoginUrl.length > 8
    ? environment.portalLoginUrl
    : 'https://uat3.ru.ac.th';
  window.location.href = loginUrl;
  return false;
};
