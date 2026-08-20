import { ApplicationConfig, provideBrowserGlobalErrorListeners, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { from } from 'rxjs';
import { environment } from '../environment/environment';

import { routes } from './app.routes';

// HTTP Interceptor: แนบ Token และ retry อัตโนมัติเมื่อเจอ 401
function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const attachToken = (token: string | null) => {
    if (!token) return req;
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  };

  const token = localStorage.getItem('token');
  const authReq = attachToken(token);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401: Token หมดอายุ, ขอใหม่แล้ว retry (เฉพาะ dev mode)
      if (error.status === 401 && !req.url.includes('/sign')) {
        const testCitizenId = !environment.production ? '1234567890123' : '';
        if (!testCitizenId) return throwError(() => error);

        const signUrl = environment.apiUrl.replace('/personnel', '/sign');
        return from(
          fetch(signUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ PER_CITIZEN_ID: testCitizenId }),
          })
            .then(res => res.json())
            .then(res => {
              if (res?.success && res?.token) {
                localStorage.setItem('token', res.token);
                return res.token as string;
              }
              return null;
            })
            .catch(() => null)
        ).pipe(
          switchMap(newToken => {
            if (!newToken) return throwError(() => error);
            // retry ด้วย Token ใหม่
            const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
            return next(retryReq);
          })
        );
      }
      return throwError(() => error);
    })
  );
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};
