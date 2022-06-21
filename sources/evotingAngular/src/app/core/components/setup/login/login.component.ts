/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild} from '@angular/core';
import {EthersService} from '@core/services/ethers.service';
import {Router} from '@angular/router';
import {Subject, throwError} from 'rxjs';
import {ObjectUtil} from '@core/utils/object.util';
import {FormControl, Validators} from '@angular/forms';
import {ROUTE_PATHS} from '@app/route-paths';
import {ethers} from 'ethers';
import {ToasterService} from '@core/services/toaster.service';
import {ToasterType} from '@core/models/toaster.model';
import {SessionStorageUtil} from '@core/utils/session-storage.util';
import {OracleService} from '@core/services/oracle.service';
import {CryptoFacade} from '@core/services/crypto.facade';
import {COOKIE_ACCESS, SetupStep} from '@core/models/common.model';
import {catchError} from 'rxjs/operators';
import {CookieService} from 'ngx-cookie-service';
import {jwtUser} from '@user/models/user.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements AfterViewInit, OnDestroy {

  requestLoading = false;
  usernameControl = new FormControl('', Validators.required);
  passwordControl = new FormControl('', Validators.required);
  tokenControl = new FormControl('', Validators.required);
  routePaths = ROUTE_PATHS;

  setupSteps = SetupStep;
  loginTabGroupIndex = 0;
  @ViewChild('usernameInput') usernameInput: ElementRef;
  @ViewChild('passwordInput') passwordInput: ElementRef;

  private unsubscribe$ = new Subject();
  @Output() loginAction = new EventEmitter<void>();
  @Output() changePassword = new EventEmitter<number>();
  @Output() registerAction = new EventEmitter<jwtUser>();

  constructor(private ethersService: EthersService,
              private router: Router,
              private toasterService: ToasterService,
              private oracleService: OracleService,
              private cryptoFacade: CryptoFacade,
              private cookieService: CookieService) {
  }

  ngAfterViewInit() {
    if (this.usernameInput) {
      this.usernameInput.nativeElement.focus();
    }
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  login() {
    this.requestLoading = true;
    this.oracleService.getMnemonic(this.usernameControl.value, this.cryptoFacade.getKeccak256(this.passwordControl.value)).pipe(
      catchError(err => {
        if (err.status === 423) {
          this.loginTabGroupIndex = 1;
          this.toasterService.addToaster(
            {
              type: ToasterType.ERROR,
              message: 'Message.Error.Login-Register'
            });
        }
        if (err.status === 401) {
          this.toasterService.addToaster(
            {
              type: ToasterType.ERROR,
              message: 'Message.Error.Login'
            });
        }
        this.usernameControl.reset();
        this.passwordControl.reset();
        this.requestLoading = false;
        return throwError(err);
      })
    ).subscribe((encryptedMnemonic: string) => {
        const mnemonic = SessionStorageUtil.decryptMnemonic(encryptedMnemonic, this.passwordControl.value);
        if (this.isMnemonicValid(mnemonic)) {
          this.ethersService.createSigner(mnemonic);
          SessionStorageUtil.setMnemonic(mnemonic);
          SessionStorageUtil.setEncryptedMnemonic(encryptedMnemonic);
          SessionStorageUtil.setHashedPassword(this.cryptoFacade.getKeccak256(this.passwordControl.value));
          this.loginAction.emit();
        } else {
          this.requestLoading = false;
          this.toasterService.addToaster(
            {
              type: ToasterType.ERROR,
              message: 'Message.Error.Login'
            });
        }
      }
    );
  }

  sendToken() {
    this.requestLoading = true;
    this.oracleService.sendToken(this.tokenControl.value).pipe(
      catchError(err => {
        this.requestLoading = false;
        this.toasterService.addToaster({type: ToasterType.ERROR, message: 'Message.Error.Login-Token'});
        this.tokenControl.reset();
        return throwError(err);
      }))
      .subscribe((jwt: string) => {
        this.cookieService.set(COOKIE_ACCESS, jwt);
        this.oracleService.whoAmI().subscribe(
          (user: jwtUser) => {
            this.requestLoading = false;
            this.registerAction.emit(user);
          });
      });
  }

  isPasswordValid(): boolean {
    return !ObjectUtil.isNullOrUndefined(this.passwordControl.value)
      && this.passwordControl.value !== '' && this.passwordControl.valid;
  }

  isUsernameValid(): boolean {
    return !ObjectUtil.isNullOrUndefined(this.usernameControl.value) && this.usernameControl.value !== '';
  }

  isMnemonicValid(mnemonic): boolean {
    return !ObjectUtil.isNullOrUndefined(mnemonic) && mnemonic !== '' && ethers.utils.isValidMnemonic(mnemonic);
  }

  isTokenValid(): boolean {
    return this.tokenControl && this.tokenControl.value !== ''
      && !ObjectUtil.isNullOrUndefined(this.tokenControl.value);
  }

  onKeyupRegister() {
    if (this.isTokenValid()) {
      this.sendToken();
    }
  }

  onKeyupLogin() {
    if (this.isPasswordValid() && this.isUsernameValid()) {
      this.login();
    }
  }

}
