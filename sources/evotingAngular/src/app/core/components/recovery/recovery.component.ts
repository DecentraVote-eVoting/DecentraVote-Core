/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component} from '@angular/core';
import {ROUTE_PATHS} from '@app/route-paths';
import {Router} from '@angular/router';
import {LocalStorageUtil} from '@core/utils/local-storage.util';
import {CookieService} from 'ngx-cookie-service';
import {COOKIE_ACCESS, COOKIE_REFRESH} from '@core/models/common.model';

@Component({
  selector: 'app-recovery',
  templateUrl: './recovery.component.html'
})
export class RecoveryComponent {

  routePaths = ROUTE_PATHS;

  constructor(private router: Router,
              private cookieService: CookieService) {
  }

  onConfirm() {
    LocalStorageUtil.removeMnemonic();
    this.cookieService.delete(COOKIE_ACCESS, '/');
    this.cookieService.delete(COOKIE_REFRESH, '/');
    this.cookieService.delete(COOKIE_ACCESS, '/app');
    this.cookieService.delete(COOKIE_REFRESH, '/app');
    this.router.navigate([ROUTE_PATHS.SETUP.valueOf()]).catch(_ => console.warn('Could not navigate to route'));
  }

}
