/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ROUTE_PATHS} from '@app/route-paths';
import {SetupComponent} from '@core/components/setup/setup.component';
import {IsSetupCompleteGuard} from '@core/guards/is-setup-complete-guard.service';
import {IsSignerCreatedGuard} from '@core/guards/is-signer-created-guard.service';
import {IsAuthorizedGuard} from '@core/guards/is-authorized-guard.service';
import {VoteVerificationSmartComponent} from '@voting/components/vote-verification/vote-verification-smart.component';
import {NegateIsSetupCompleteGuardService} from '@core/guards/negate-is-setup-complete-guard.service';
import {LoadingEthComponent} from '@core/components/setup/loading-eth/loading-eth.component';
import {VoteCertificateSmartComponent} from '@voting/components/vote-certificate/vote-certificate-smart.component';

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: ROUTE_PATHS.SETUP.valueOf(),
    pathMatch: 'full',
  },
  {
    path: ROUTE_PATHS.SETUP.valueOf(),
    component: SetupComponent,
    canActivate: [NegateIsSetupCompleteGuardService]
  },
  {
    path: ROUTE_PATHS.EXTERNAL_LOGOUT.valueOf(),
    redirectTo: ROUTE_PATHS.SETUP.valueOf()
  },
  {
    path: ROUTE_PATHS.LINK_ETH_ADDRESS.valueOf(),
    component: LoadingEthComponent,
    canActivate: [IsSetupCompleteGuard, IsSignerCreatedGuard, IsAuthorizedGuard]
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
  },
  {
    path: ROUTE_PATHS.CERTIFICATE.valueOf(),
    component: VoteCertificateSmartComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes, { enableTracing: false, useHash: true, relativeLinkResolution: 'legacy' })
  ],
  exports: [
    RouterModule
  ],
})
export class AppRoutingModule {
}
