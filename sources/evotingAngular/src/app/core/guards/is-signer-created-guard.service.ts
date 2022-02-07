/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {ROUTE_PATHS} from '@app/route-paths';
import {EthersService} from '@core/services/ethers.service';
import {SessionStorageUtil} from '@core/utils/session-storage.util';

@Injectable({
  providedIn: 'root'
})
export class IsSignerCreatedGuard implements CanActivate {

  constructor(private ethersService: EthersService,
              private router: Router) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const loggedIn = this.isLoggedIn();
    if(!loggedIn){
      this.router.navigate([ROUTE_PATHS.LOGIN.valueOf()]).catch(_ => console.warn('Could not navigate to route'));
    }
    return loggedIn;
  }

  isLoggedIn(): boolean {
    const mnemonic = SessionStorageUtil.getMnemonic();
    if (mnemonic && !this.ethersService.signer) {
      this.ethersService.createSigner(mnemonic);
      return true;
    }

    return !(!mnemonic || !this.ethersService.signer);


  }
}
