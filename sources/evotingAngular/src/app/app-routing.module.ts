/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LoginResponsePageComponent} from '@core/components/onboarding/login-response-page/login-response-page.component';
import {RegisterEthComponent} from '@core/components/onboarding/register-eth-addr/register-eth.component';
import {LoadingEthComponent} from '@core/components/onboarding/loading-eth/loading-eth.component';
import {ROUTE_PATHS} from '@app/route-paths';
import {SetupComponent} from '@core/components/setup/setup.component';
import {LoginComponent} from '@core/components/login/login.component';
import {IsSetupCompleteGuard} from '@core/guards/is-setup-complete-guard.service';
import {IsSignerCreatedGuard} from '@core/guards/is-signer-created-guard.service';
import {ExternalAuthComponent} from '@core/components/onboarding/external-auth/external-auth.component';
import {IsAuthorizedGuard} from '@core/guards/is-authorized-guard.service';
import {TokenAuthComponent} from '@core/components/onboarding/token-auth/token-auth.component';
import {RecoveryComponent} from '@core/components/recovery/recovery.component';
import {VoteVerificationSmartComponent} from '@voting/components/vote-verification/vote-verification-smart.component';
import {NegateIsSignerCreatedGuardService} from '@core/guards/negate-is-signer-created-guard.service';

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: ROUTE_PATHS.LOGIN.valueOf(),
    pathMatch: 'full',
  },
  {
    path: ROUTE_PATHS.SETUP.valueOf(),
    component: SetupComponent
  },
  {
    path: ROUTE_PATHS.EXTERNAL_AUTH.valueOf(),
    component: ExternalAuthComponent,
    canActivate: [IsSetupCompleteGuard, IsSignerCreatedGuard]
  },
  {
    path: ROUTE_PATHS.EXTERNAL_LOGOUT.valueOf(),
    redirectTo: ROUTE_PATHS.LOGIN.valueOf()
  },
  {
    path: ROUTE_PATHS.TOKEN_AUTH.valueOf(),
    component: TokenAuthComponent,
    canActivate: [IsSetupCompleteGuard, IsSignerCreatedGuard]
  },
  {
    path: ROUTE_PATHS.LOGIN.valueOf(),
    component: LoginComponent,
    canActivate: [IsSetupCompleteGuard, NegateIsSignerCreatedGuardService]
  },
  {
    path: ROUTE_PATHS.LOGIN_RESPONSE.valueOf(),
    component: LoginResponsePageComponent,
    canActivate: [IsSetupCompleteGuard, IsSignerCreatedGuard]
  },
  {
    path: ROUTE_PATHS.REGISTER_ETH_ADDRESS.valueOf(),
    component: RegisterEthComponent,
    canActivate: [IsSetupCompleteGuard, IsSignerCreatedGuard, IsAuthorizedGuard]
  },
  {
    path: ROUTE_PATHS.LINK_ETH_ADDRESS.valueOf(),
    component: LoadingEthComponent,
    canActivate: [IsSetupCompleteGuard, IsSignerCreatedGuard, IsAuthorizedGuard]
  },
  {
    path: ROUTE_PATHS.RECOVERY.valueOf(),
    component: RecoveryComponent
  },
  {
    path: ROUTE_PATHS.MEETING.valueOf(),
    loadChildren: () => import('./meeting/meeting.module').then(m => m.MeetingModule)
  },
  {
    path: ROUTE_PATHS.MEMBER.valueOf(),
    loadChildren: () => import('@app/user/user.module').then(m => m.UserModule)
  },
  {
    path: ROUTE_PATHS.VERIFICATION.valueOf(),
    component: VoteVerificationSmartComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes, {enableTracing: false, useHash: true})
  ],
  exports: [
    RouterModule
  ],
})
export class AppRoutingModule {
}
