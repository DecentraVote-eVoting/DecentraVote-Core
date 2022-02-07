/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';
import {CookieService} from 'ngx-cookie-service';
import {
  COOKIE_ACCESS,
  ENDPOINT_ALT_PROOFGEN,
  ENDPOINT_RELAY,
  ENDPOINT_STORAGE,
  HEADER_AUTHORIZATION
} from '@core/models/common.model';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationInterceptor implements HttpInterceptor {

  constructor(private cookieService: CookieService) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (request.url.includes(ENDPOINT_STORAGE) || request.url.includes(ENDPOINT_RELAY) || request.url.includes(ENDPOINT_ALT_PROOFGEN)) {
      return next.handle(request);
    }

    const req = request.clone({
      withCredentials: true,
      headers: request.headers.append(HEADER_AUTHORIZATION, `${this.cookieService.get(COOKIE_ACCESS)}`)
    });
    return next.handle(req);
  }
}

export const AuthenticationProvider = {
  provide: HTTP_INTERCEPTORS,
  useClass: AuthenticationInterceptor,
  multi: true
};
