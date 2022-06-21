import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {SessionStorageUtil} from '@core/utils/session-storage.util';
import {ROUTE_PATHS} from '@app/route-paths';

@Injectable({
  providedIn: 'root'
})
export class NegateIsSetupCompleteGuardService implements CanActivate {

  constructor(private router: Router) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {

    if (SessionStorageUtil.hasMnemonic()) {
      this.router.navigate([ROUTE_PATHS.MEETING_OVERVIEW.valueOf()]).catch(_ => console.warn('Could not navigate to route'));
      return false;
    }

    return true;
  }
}
