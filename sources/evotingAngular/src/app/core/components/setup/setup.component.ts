/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, OnDestroy} from '@angular/core';
import {SetupStep} from '@core/models/common.model';
import {Router} from '@angular/router';
import {ROUTE_PATHS} from '@app/route-paths';
import {EthersService} from '@core/services/ethers.service';
import {Subject, throwError} from 'rxjs';
import {OrganizationFacade} from '@core/services/organization.facade.service';
import {SessionStorageUtil} from '@core/utils/session-storage.util';
import {CryptoFacade} from '@core/services/crypto.facade';
import {LicenseComponent} from '@core/components/license/license.component';
import {ModalService} from '@core/services/modal.service';
import {SignatureService} from '@core/services/signature.service';
import {catchError, first, switchMap} from 'rxjs/operators';
import {SignatureModel} from '@core/models/signature.model';
import {OracleService} from '@core/services/oracle.service';
import {ToasterType} from '@core/models/toaster.model';
import {ToasterService} from '@core/services/toaster.service';
import {jwtUser} from '@user/models/user.model';
import {LoggingUtil} from '@core/utils/logging.util';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html'
})
export class SetupComponent implements OnDestroy {

  currentStep = SetupStep.MAIN_LOGIN;
  setupStep = SetupStep;
  isCreatingNew = true;
  jwtUser: jwtUser;

  private unsubscribe$ = new Subject();

  constructor(private router: Router,
              private ethersService: EthersService,
              private organizationFacade: OrganizationFacade,
              private cryptoFacade: CryptoFacade,
              private modalService: ModalService,
              private signatureService: SignatureService,
              private oracleService: OracleService,
              private toasterService: ToasterService) {
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  loginComplete() {
    this.router.navigate([ROUTE_PATHS.MEETING_OVERVIEW.valueOf()]).catch(_ => console.warn('Could not navigate to route'));
  }

  changePasswordStep() {
    this.isCreatingNew = false;
    this.currentStep = this.setupStep.MNEMONIC_PASSWORD.valueOf();
  }

  register(jwt: jwtUser) {
    this.isCreatingNew = true;
    this.jwtUser = jwt;
    this.currentStep = this.setupStep.MNEMONIC_PASSWORD.valueOf();
  }

  resetPassword() {
    SessionStorageUtil.removeHashedPassword();
    this.currentStep = this.setupStep.MAIN_LOGIN.valueOf();
  }

  setMnemonicAndPassword(obj) {
    SessionStorageUtil.setHashedPassword(this.cryptoFacade.getKeccak256(obj.password));
    SessionStorageUtil.setMnemonic(obj.mnemonic);
    SessionStorageUtil.setEncryptedMnemonic(SessionStorageUtil.encryptMnemonic(obj.mnemonic, obj.password));
    this.ethersService.createSigner(obj.mnemonic);

    if (this.isCreatingNew) {
      this.cryptoFacade.getSecretHash()
        .pipe(first())
        .subscribe(secretHash => {
          this.oracleService.registerMember(
            obj.address,
            secretHash,
            SessionStorageUtil.getHashedPassword(),
            SessionStorageUtil.getEncryptedMnemonic()
          ).pipe(first())
            .subscribe((transactionHash: string) => {
              this.router.navigate([ROUTE_PATHS.LINK_ETH_ADDRESS.valueOf()],
                {
                  queryParams: {
                    transactionHash: transactionHash
                  }
                }).catch(_ => console.warn('Could not navigate to route'));
            }, error => {
              document.cookie = 'evoting-access= ; expires = Thu, 01 Jan 1970 00:00:00 GMT';
              LoggingUtil.error(error);
            });
        });
    } else {
      this.signatureService.createSignature(false).pipe(
        first(),
        switchMap((signature: SignatureModel) =>
          this.oracleService.changePassword(
            signature,
            SessionStorageUtil.getHashedPassword(),
            SessionStorageUtil.getEncryptedMnemonic()
          ).pipe(
            catchError(err => {
              this.toasterService.addToaster(
                {
                  type: ToasterType.ERROR,
                  message: 'Message.Error.Renew-Password'
                });
              LoggingUtil.error(err);
              return throwError(err);
            })
          )
        )).subscribe(_ => this.loginComplete());
    }
  }

  onOpenLicenseModal() {
    this.modalService.openModal<LicenseComponent>(LicenseComponent, {});
  }

}
