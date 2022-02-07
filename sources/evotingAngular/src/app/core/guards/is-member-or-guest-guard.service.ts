/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {OrganizationContractService} from '../services/organization-contract.service';
import {EthersService} from '@core/services/ethers.service';
import {ROUTE_PATHS} from '@app/route-paths';
import {AuthenticationMethod} from '@core/models/common.model';
import {OrganizationFacade} from '@core/services/organization.facade.service';
import {UserFacade} from '@user/services/user.facade';
import {Role} from '@user/models/role.model';

@Injectable({
  providedIn: 'root'
})
export class IsMemberOrGuestGuard implements CanActivate {

  constructor(private router: Router,
              private ethersService: EthersService,
              private organizationFacade: OrganizationFacade,
              private organizationContractService: OrganizationContractService,
              private userFacade: UserFacade) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    return this.userFacade.getMyRoleFromStoreOrContract().pipe(
      map((role: Role) => {
          if (role.value > Role.NONE.value) {
            return true;
          }
          this.redirectToAuth();
          return false;
        }
      ));
  }

  private redirectToAuth() {
    this.organizationFacade.getAuthOptions(true)
      .subscribe(options => {
        if (options && options.length > 0) {
          switch (options[0]) {
            case AuthenticationMethod.TOKEN:
              this.router.navigate([ROUTE_PATHS.TOKEN_AUTH.valueOf()]).catch(_ => console.warn('Could not navigate to route'));
              break;
            case AuthenticationMethod.KEYCLOAK:
            default:
              this.router.navigate([ROUTE_PATHS.EXTERNAL_AUTH.valueOf()]).catch(_ => console.warn('Could not navigate to route'));
              break;
          }
        }
      });
  }
}
