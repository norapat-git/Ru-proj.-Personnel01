import { ApplicationConfig, provideBrowserGlobalErrorListeners, inject } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../environment/environment';

import { routes } from './app.routes';
import { extractTokenFromAnywhere } from './guards/auth.guard';

// HTTP Interceptor 
function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  let token = localStorage.getItem('token');
  if (!token) {
    token = extractTokenFromAnywhere();
    if (token) {
      localStorage.setItem('token', token);
    }
  }

  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        localStorage.removeItem('token');
        if (environment.production && environment.portalLoginUrl && environment.portalLoginUrl.length > 8) {
          window.location.href = environment.portalLoginUrl;
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
