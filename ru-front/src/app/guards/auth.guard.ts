import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { environment } from '../../environment/environment';
import { PersonnelService } from '../services/services';

// Auth Guard
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const personnelService = inject(PersonnelService);

  // Token ส่งมาพร้อม URL
  const urlToken = route.queryParams['token'];
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
    window.location.href = environment.portalLoginUrl;
    return false;
  } else {
    // DEV
    console.warn('AuthGuard DEV bypassing');
    return true;
  }
};

