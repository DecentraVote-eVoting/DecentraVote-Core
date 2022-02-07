/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable, of} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {catchError, switchMap} from 'rxjs/operators';
import {OracleService} from '@core/services/oracle.service';


@Injectable({
  providedIn: 'root'
})
export class IsAuthorizedGuard implements CanActivate {

  constructor(private router: Router,
              private http: HttpClient,
              private oracleService: OracleService) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.oracleService.whoAmI().pipe(
      switchMap((_) => {
        return of(true);
      }),
      catchError(_ => {
        return of(false);
      })
    );
  }
}
