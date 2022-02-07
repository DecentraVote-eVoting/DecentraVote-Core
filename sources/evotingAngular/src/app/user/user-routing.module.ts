/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {IsSetupCompleteGuard} from '@core/guards/is-setup-complete-guard.service';
import {IsSignerCreatedGuard} from '@core/guards/is-signer-created-guard.service';
import {UserOverviewSmartComponent} from './/components/user-overview/user-overview-smart.component';
import {IsMemberOrGuestGuard} from '@core/guards/is-member-or-guest-guard.service';

const meetingRoutes: Routes = [
  {
    path: 'overview',
    component: UserOverviewSmartComponent,
    canActivate: [IsSetupCompleteGuard, IsSignerCreatedGuard, IsMemberOrGuestGuard]
  },
];

@NgModule({
  imports: [RouterModule.forChild(meetingRoutes)],
  exports: [RouterModule]
})
export class UserRoutingModule {
}
