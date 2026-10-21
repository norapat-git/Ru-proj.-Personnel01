import { ApplicationConfig, provideBrowserGlobalErrorListeners, inject } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError, switchMap, from } from 'rxjs';
import { environment } from '../environment/environment';

import { routes } from './app.routes';
import { extractTokenFromAnywhere } from './guards/auth.guard';

// HTTP Interceptor 
function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const token = sessionStorage.getItem('token');

  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // ใน DEV Mode: หาก Token ไม่ถูกต้องหรือหมดอายุ ให้ขอ Token ใหม่จาก /sign และ retry ทันที
        if (!environment.production && !req.url.includes('/sign')) {
          const signUrl = (environment as any).signUrl || environment.apiUrl.replace(/\/personnel$/, '/sign');
          const devBody: any = {
            client_id: '1234567890123',
            PER_CITIZEN_ID: '1234567890123',
            uid: '1234567890123',
          };
          if ((environment as any).secret_key) {
            devBody.secret_key = (environment as any).secret_key;
            devBody.secrete_id = (environment as any).secret_key;
          }
          return from(
            fetch(signUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(devBody),
            })
              .then(res => res.json())
              .then(res => {
                if (res?.success && res?.token) {
                  sessionStorage.setItem('token', res.token);
                  return res.token as string;
                }
                return null;
              })
              .catch(() => null)
          ).pipe(
            switchMap(newToken => {
              if (!newToken) return throwError(() => error);
              const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next(retryReq);
            })
          );
        }

        // ใน Production Mode: ลบ Token และ Redirect ไปยังหน้า Login
        sessionStorage.removeItem('token');
        const loginUrl = environment.portalLoginUrl && environment.portalLoginUrl.length > 8
          ? environment.portalLoginUrl
          : 'https://uat3.ru.ac.th';
        if (environment.production) {
          window.location.href = loginUrl;
        }
      }
      return throwError(() => error);
    })
  );
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};
