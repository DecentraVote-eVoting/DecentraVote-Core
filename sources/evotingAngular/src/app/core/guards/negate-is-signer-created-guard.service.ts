/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {ROUTE_PATHS} from '@app/route-paths';
import {EthersService} from '@core/services/ethers.service';
import {IsSignerCreatedGuard} from '@core/guards/is-signer-created-guard.service';

@Injectable({
  providedIn: 'root'
})
export class NegateIsSignerCreatedGuardService implements CanActivate {

  constructor(private ethersService: EthersService,
              private router: Router,
              private isSignerCreatedGuard: IsSignerCreatedGuard) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const signerCreated = this.isSignerCreatedGuard.isLoggedIn();
    if (signerCreated === true) {
      this.router.navigate([ROUTE_PATHS.MEETING_OVERVIEW]);
    }
    return !signerCreated;
  }
}
