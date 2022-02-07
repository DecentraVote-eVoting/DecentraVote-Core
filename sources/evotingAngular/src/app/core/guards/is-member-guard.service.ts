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
import {OracleService} from '@core/services/oracle.service';
import {ROUTE_PATHS} from '@app/route-paths';
import {UserFacade} from '@user/services/user.facade';
import {Role} from '@user/models/role.model';

@Injectable({
  providedIn: 'root'
})
export class IsMemberGuard implements CanActivate {

  constructor(private router: Router,
              private ethersService: EthersService,
              private oracleService: OracleService,
              private organizationContractService: OrganizationContractService,
              private userFacade: UserFacade) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {

    return this.userFacade.getMyRoleFromStoreOrContract().pipe(
      map((role: Role) => {
          if (role.isRole(Role.MEMBER)) { return true; }
          this.router.navigate([ROUTE_PATHS.MEETING_OVERVIEW.valueOf()]).catch(_ => console.warn('Could not navigate to route'));
          return false;
        }
      ));
  }
}
