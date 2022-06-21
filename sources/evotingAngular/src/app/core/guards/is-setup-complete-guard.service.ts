/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {ROUTE_PATHS} from '@app/route-paths';
import {SessionStorageUtil} from '@core/utils/session-storage.util';

@Injectable({
  providedIn: 'root'
})
export class IsSetupCompleteGuard implements CanActivate {

  constructor(private router: Router) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {

    if (!SessionStorageUtil.hasMnemonic()) {
      this.router.navigate([ROUTE_PATHS.SETUP.valueOf()]).catch(_ => console.warn('Could not navigate to route'));
      return false;
    }

    return true;
  }
}
