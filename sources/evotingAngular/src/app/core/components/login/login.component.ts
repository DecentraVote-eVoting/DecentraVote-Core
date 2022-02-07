/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {AfterViewInit, Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {EthersService} from '@core/services/ethers.service';
import {Router} from '@angular/router';
import {Subject} from 'rxjs';
import {ObjectUtil} from '@core/utils/object.util';
import {FormControl, Validators} from '@angular/forms';
import {LocalStorageUtil} from '@core/utils/local-storage.util';
import {ROUTE_PATHS} from '@app/route-paths';
import {ethers} from 'ethers';
import {ToasterService} from '@core/services/toaster.service';
import {ToasterType} from '@core/models/toaster.model';
import {SessionStorageUtil} from '@core/utils/session-storage.util';
import {CreateMeetingModalComponent} from "@meeting/components/create-meeting-modal/create-meeting-modal.component";
import {ModalService} from "@core/services/modal.service";
import {LicenseComponent} from "@core/components/license/license.component";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements AfterViewInit, OnDestroy {

  loginLoading = false;
  passwordControl = new FormControl('', Validators.required);
  routePaths = ROUTE_PATHS;

  @ViewChild('passwordInput') passwordInput: ElementRef;

  private unsubscribe$ = new Subject();

  constructor(private ethersService: EthersService,
              private router: Router,
              private toasterService: ToasterService,
              private modalService: ModalService) {
  }

  ngAfterViewInit() {
    if (this.passwordInput) {
      this.passwordInput.nativeElement.focus();
    }
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  login() {
    const mnemonic = LocalStorageUtil.getMnemonic(this.passwordControl.value);
    if (this.isMnemonicValid(mnemonic)) {
      this.loginLoading = true;
      this.ethersService.createSigner(mnemonic);
      SessionStorageUtil.setMnemonic(mnemonic);
      this.router.navigate([ROUTE_PATHS.MEETING_OVERVIEW.valueOf()])
        .catch(_ => console.warn('Could not navigate to route'));
    } else {
      this.toasterService.addToaster(
        {
          type: ToasterType.ERROR,
          message: 'Message.Error.Login'
        });
    }
  }

  isPasswordValid(): boolean {
    return !ObjectUtil.isNullOrUndefined(this.passwordControl.value)
      && this.passwordControl.value !== '' && this.passwordControl.valid;
  }

  isMnemonicValid(mnemonic): boolean {
    return !ObjectUtil.isNullOrUndefined(mnemonic) && mnemonic !== '' && ethers.utils.isValidMnemonic(mnemonic);
  }

  onKeyup() {
    if (this.isPasswordValid()) {
      this.login();
    }
  }

  onOpenLicenseModal() {
      this.modalService.openModal<LicenseComponent>(LicenseComponent, {});
  }

}
