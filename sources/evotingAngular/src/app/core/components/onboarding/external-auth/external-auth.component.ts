/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {ROUTE_PATHS} from '@app/route-paths';
import {COOKIE_ACCESS, COOKIE_REFRESH, TOKEN_ACCESS, TOKEN_REFRESH} from '@core/models/common.model';
import {CookieService} from 'ngx-cookie-service';
import {EnvironmentService} from '@core/services/environment.service';

@Component({
  selector: 'app-external-auth',
  templateUrl: './external-auth.component.html'
})
export class ExternalAuthComponent implements OnInit {

  // TODO should we get these config values from the contract instead?
  private readonly oracleUrl;
  private readonly domain: string;

  constructor(private router: Router,
              private cookieService: CookieService,
              private env: EnvironmentService) {
    this.oracleUrl = env.getOracleURL();
    this.domain = window.location.origin;
  }

  ngOnInit() {
    window.removeEventListener('message', this.receiveMessage);
    const strWindowFeatures = 'toolbar=no, menubar=no, width=340, height=550, top=100, left=100';
    window.addEventListener('message', event => this.receiveMessage(event), false);
    const ref = window.open(this.oracleUrl + '/auth/login/keycloak?domain=' + this.domain, '', strWindowFeatures);
    if (ref) {
      ref.focus();
    }
  }

  receiveMessage(event) {
    if (event.data && event.data.hasOwnProperty(TOKEN_ACCESS) && event.data.hasOwnProperty(TOKEN_REFRESH)) {
      this.cookieService.set(COOKIE_ACCESS, event.data[TOKEN_ACCESS]);
      this.cookieService.set(COOKIE_REFRESH, event.data[TOKEN_REFRESH]);
      this.router.navigate([ROUTE_PATHS.REGISTER_ETH_ADDRESS.valueOf()]).catch(_ => console.warn('Could not navigate to route'));
    }
  }

}
