/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';
import {ObjectUtil} from '@core/utils/object.util';
import {OracleService} from '@core/services/oracle.service';
import {catchError, tap} from 'rxjs/operators';
import {EMPTY} from 'rxjs';
import {Router} from '@angular/router';
import {ToasterService} from '@core/services/toaster.service';
import {ToasterType} from '@core/models/toaster.model';
import {ROUTE_PATHS} from '@app/route-paths';
import {EthersService} from '@core/services/ethers.service';
import {COOKIE_ACCESS} from '@core/models/common.model';
import {CookieService} from 'ngx-cookie-service';

@Component({
  selector: 'app-token-auth',
  templateUrl: './token-auth.component.html'
})
export class TokenAuthComponent implements AfterViewInit {

  tokenControl = new FormControl();
  tokenLoading = false;

  @ViewChild('tokenInput') tokenInput: ElementRef;


  constructor(private oracleService: OracleService,
              private router: Router,
              private ethersService: EthersService,
              private toasterService: ToasterService,
              private cookieService: CookieService) {
  }

  ngAfterViewInit() {
    if (this.tokenInput) {
      this.tokenInput.nativeElement.focus();
    }
  }

  isTokenValid(): boolean {
    return this.tokenControl && this.tokenControl.value !== ''
      && !ObjectUtil.isNullOrUndefined(this.tokenControl.value);
  }

  sendToken() {
    this.tokenLoading = true;
    this.oracleService.sendToken(this.tokenControl.value)
      .pipe(
        tap(jwt => {
          this.cookieService.set(COOKIE_ACCESS, jwt);
        }),
        catchError(_ => {
          this.tokenLoading = false;
          this.toasterService.addToaster({type: ToasterType.ERROR, message: 'Message.Error.Login-Token'});
          return EMPTY;
        }))
      .subscribe(_ => {
        this.tokenLoading = false;
        this.router.navigate([ROUTE_PATHS.REGISTER_ETH_ADDRESS.valueOf()]).catch(_ => console.warn('Could not navigate to route'));
      });
  }

  onKeyup() {
    if (this.isTokenValid()) {
      this.sendToken();
    }
  }

}
