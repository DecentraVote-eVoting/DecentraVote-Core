/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {NgModule} from '@angular/core';
import {ToasterComponent} from '@core/components/toaster/toaster.component';
import {SpinnerComponent} from '@core/components/spinner/spinner.component';
import {RegisterEthComponent} from '@core/components/onboarding/register-eth-addr/register-eth.component';
import {LoginResponsePageComponent} from '@core/components/onboarding/login-response-page/login-response-page.component';
import {LoadingEthComponent} from '@core/components/onboarding/loading-eth/loading-eth.component';
import {MemberNamePipe} from '@core/pipes/member-name.pipe';
import {EffectsModule} from '@ngrx/effects';
import {CoreEffects} from '@core/+state/core.effects';
import {TranslateModule} from '@ngx-translate/core';
import {CommonModule} from '@angular/common';
import {NgbDateAdapter, NgbDateNativeAdapter, NgbDateParserFormatter, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {NgbCustomDateFormatter} from '@core/services/ngb-custom-date-formatter';
import {RouterModule} from '@angular/router';
import {SetupComponent} from '@core/components/setup/setup.component';
import {SetupGetStartedComponent} from '@core/components/setup/setup-get-started/setup-get-started.component';
import {SetupCreatePasswordComponent} from '@core/components/setup/setup-create-password/setup-create-password.component';
import {ReactiveFormsModule} from '@angular/forms';
import {SetupCreateMnemonicComponent} from '@core/components/setup/setup-create-mnemonic/setup-create-mnemonic.component';
import {LoginComponent} from './components/login/login.component';
import {ResolveAssetPipe} from '@core/pipes/resolve-asset.pipe';
import {SetupNewOrImportComponent} from '@core/components/setup/setup-new-or-import/setup-new-or-import.component';
import {ExternalAuthComponent} from './components/onboarding/external-auth/external-auth.component';
import {TokenAuthComponent} from '@core/components/onboarding/token-auth/token-auth.component';
import {LogoHeaderComponent} from '@core/components/logo-header/logo-header.component';
import {RecoveryComponent} from '@core/components/recovery/recovery.component';
import {BigSpinnerComponent} from '@core/components/big-spinner/big-spinner.component';
import {ShowMnemonicModalComponent} from '@core/components/show-mnemonic-modal/show-mnemonic-modal.component';
import {UserEffects} from '@app/user/+state/user.effects';
import { RoleBadgesComponent } from './components/role-badges/role-badges.component';
import {SolidityErrorPipe} from '@core/pipes/solidity-error.pipe';
import {CastPipe} from '@core/pipes/cast.pipe';
import { ConfirmationDialogModalComponent } from './components/confirmation-dialog-modal/confirmation-dialog-modal.component';
import { DropdownDirective} from '../meeting/components/dropdown/dropdown.component';
import {MatMenuModule} from '@angular/material/menu';
import {NgCircleProgressModule} from "ng-circle-progress";
import {ClipboardModule} from '@angular/cdk/clipboard';
import {paginationComponent} from "@core/components/pagination/pagination.component";
import {UserSortPipe} from '@core/pipes/user-sort.pipe';
import {LicenseComponent} from "@core/components/license/license.component";

const COMPONENTS = [
  ToasterComponent,
  SpinnerComponent,
  LogoHeaderComponent,
  RegisterEthComponent,
  LoadingEthComponent,
  LoginResponsePageComponent,
  LoginComponent,
  ExternalAuthComponent,
  TokenAuthComponent,
  BigSpinnerComponent,
  RoleBadgesComponent,
  ConfirmationDialogModalComponent,
  DropdownDirective,
  paginationComponent,
  LicenseComponent
];

const COMPONENTS_SETUP = [
  SetupComponent,
  SetupGetStartedComponent,
  SetupNewOrImportComponent,
  SetupCreatePasswordComponent,
  SetupCreateMnemonicComponent,
  RecoveryComponent
];

const MODAL_COMPONENTS = [
  ShowMnemonicModalComponent
];

const PIPES = [
  MemberNamePipe,
  ResolveAssetPipe,
  SolidityErrorPipe,
  CastPipe,
  UserSortPipe
];

@NgModule({
  declarations: [COMPONENTS, COMPONENTS_SETUP, MODAL_COMPONENTS, PIPES],
  entryComponents: [MODAL_COMPONENTS],
    imports: [
        CommonModule,
        NgbModule,
        RouterModule,
        EffectsModule.forFeature([CoreEffects, UserEffects]),
        TranslateModule,
        ReactiveFormsModule,
        MatMenuModule,
        NgCircleProgressModule,
        ClipboardModule
    ],
  exports: [COMPONENTS, COMPONENTS_SETUP, PIPES],
  providers: [
    {
      provide: NgbDateAdapter,
      useClass: NgbDateNativeAdapter
    },
    {
      provide: NgbDateParserFormatter,
      useClass: NgbCustomDateFormatter
    }
  ],
})
export class CoreModule {
}
