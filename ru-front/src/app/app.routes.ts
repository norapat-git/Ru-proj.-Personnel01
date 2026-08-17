import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { App } from './app';

export const routes: Routes = [
  {
    path: '',
    component: App,
    canActivate: [authGuard] // ตรวจสิทธิ์ก่อนเข้าหน้าแรก
  },
  { path: '**', redirectTo: '' }
];

