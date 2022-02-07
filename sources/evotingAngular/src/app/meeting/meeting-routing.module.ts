/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {MeetingDetailSmartComponent} from '@meeting/components/meeting-detail/meeting-detail-smart.component';
import {MeetingOverviewSmartComponent} from '@meeting/components/meeting-overview/meeting-overview-smart.component';
import {IsSetupCompleteGuard} from '@core/guards/is-setup-complete-guard.service';
import {IsSignerCreatedGuard} from '@core/guards/is-signer-created-guard.service';
import {IsMemberOrGuestGuard} from '@core/guards/is-member-or-guest-guard.service';
import {MeetingSummarySmartComponent} from '@meeting/components/meeting-summary/meeting-summary-smart.component';

const meetingRoutes: Routes = [
  {
    path: 'overview',
    component: MeetingOverviewSmartComponent,
    canActivate: [IsSetupCompleteGuard, IsSignerCreatedGuard, IsMemberOrGuestGuard]
  },
  {
    path: 'detail/:meetingAddress',
    component: MeetingDetailSmartComponent,
    canActivate: [IsSetupCompleteGuard, IsSignerCreatedGuard, IsMemberOrGuestGuard]
  },
  {
    path: 'summary/:meetingAddress',
    component: MeetingSummarySmartComponent,
    canActivate: [IsSetupCompleteGuard, IsSignerCreatedGuard, IsMemberOrGuestGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(meetingRoutes)],
  exports: [RouterModule]
})
export class MeetingRoutingModule {
}
