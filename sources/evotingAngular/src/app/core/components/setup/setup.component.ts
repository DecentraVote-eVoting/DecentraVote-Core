/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, OnDestroy} from '@angular/core';
import {SetupStep} from '@core/models/common.model';
import {Router} from '@angular/router';
import {ROUTE_PATHS} from '@app/route-paths';
import {EthersService} from '@core/services/ethers.service';
import {first} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {OrganizationFacade} from '@core/services/organization.facade.service';
import {LocalStorageUtil} from '@core/utils/local-storage.util';
import {SessionStorageUtil} from '@core/utils/session-storage.util';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html'
})
export class SetupComponent implements OnDestroy {

  currentStep = SetupStep.GET_STARTED;
  setupStep = SetupStep;
  isCreatingNew = true;
  password = '';

  private unsubscribe$ = new Subject();

  constructor(private router: Router,
              private ethersService: EthersService,
              private organizationFacade: OrganizationFacade) {

    this.organizationFacade.getMnemonic()
      .pipe(first())
      .subscribe(mnemonic => {
        if (mnemonic === null) {
          router.navigate([ROUTE_PATHS.LOGIN.valueOf()]).catch(_ => console.warn('Could not navigate to route'));
        }
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  increaseStep() {
    this.currentStep++;

    if (this.currentStep === SetupStep.FINISH) {
      this.router.navigate([ROUTE_PATHS.MEETING_OVERVIEW.valueOf()]).catch(_ => console.warn('Could not navigate to route'));
    }
  }

  decreaseStep() {
    this.currentStep--;

    if (this.currentStep === SetupStep.GET_STARTED) {
      this.router.navigate([ROUTE_PATHS.SETUP.valueOf()]).catch(_ => console.warn('Could not navigate to route'));
    }
  }

  setNewOrImport(isNew: boolean) {
    this.isCreatingNew = isNew;
    this.increaseStep();
  }

  resetNewOrImport() {
    this.isCreatingNew = true;
    this.decreaseStep();
  }

  setPassword(password: string) {
    this.password = password;
    this.increaseStep();
  }

  resetPassword() {
    this.password = '';
    this.decreaseStep();
  }

  setMnemonic(mnemonic: string) {
    LocalStorageUtil.setMnemonic(mnemonic, this.password);
    SessionStorageUtil.setMnemonic(mnemonic);
    this.ethersService.createSigner(mnemonic);
    this.increaseStep();
  }

}
