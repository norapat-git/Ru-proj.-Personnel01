import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { environment } from '../../environment/environment';

// Auth Guard - ตรวจสอบ Token ก่อนเข้าใช้งาน
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);

  // Token ส่งมาพร้อม URL (?token=...) จากเว็บหลัก
  const urlToken = route.queryParams['token'];
  if (urlToken) {
    localStorage.setItem('token', urlToken);
    return true;
  }

  // Token บันทึกไว้ใน localStorage แล้ว
  const savedToken = localStorage.getItem('token');
  if (savedToken) {
    return true;
  }

  // ไม่พบ Token
  if (environment.production) {
    // Production redirect ไปเว็บหลัก
    window.location.href = environment.portalLoginUrl;
    return false;
  } else {
    // Development
    console.warn('AuthGuard DEV bypassing');
    return true;
  }
};
