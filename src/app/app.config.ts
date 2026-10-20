import { ApplicationConfig, provideBrowserGlobalErrorListeners, inject } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../environment/environment';

import { routes } from './app.routes';
import { extractTokenFromAnywhere } from './guards/auth.guard';

// HTTP Interceptor 
function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  let token = sessionStorage.getItem('token');
  if (!token) {
    token = extractTokenFromAnywhere();
    if (token) {
      sessionStorage.setItem('token', token);
    }
  }

  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
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
