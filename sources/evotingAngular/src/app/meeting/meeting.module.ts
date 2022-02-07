/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AuthoritiesListComponent} from '@meeting/components/authorities-list/authorities-list.component';
import {AuthoritiesListSmartComponent} from '@meeting/components/authorities-list/authorities-list-smart.component';
import {CreateMeetingModalComponent} from '@meeting/components/create-meeting-modal/create-meeting-modal.component';
import {CreateAuthorityModalComponent} from '@meeting/components/create-authority-modal/create-authority-modal.component';
import {MeetingDetailComponent} from '@meeting/components/meeting-detail/meeting-detail.component';
import {MeetingDetailSmartComponent} from '@meeting/components/meeting-detail/meeting-detail-smart.component';
import {MeetingOverviewSmartComponent} from '@meeting/components/meeting-overview/meeting-overview-smart.component';
import {MeetingOverviewComponent} from '@meeting/components/meeting-overview/meeting-overview.component';
import {MeetingCardComponent} from '@meeting/components/meeting-card/meeting-card.component';
import {MeetingCardSmartComponent} from '@meeting/components/meeting-card/meeting-card-smart.component';
import {MeetingHeaderComponent} from '@meeting/components/meeting-header/meeting-header.component';
import {MeetingHeaderSmartComponent} from '@meeting/components/meeting-header/meeting-header-smart.component';
import {ParticipantsListComponent} from '@meeting/components/participants-list/participants-list.component';
import {ParticipantsListSmartComponent} from '@meeting/components/participants-list/participants-list-smart.component';
import {CoreModule} from '@core/core.module';
import {MeetingRoutingModule} from '@meeting/meeting-routing.module';
import {EffectsModule} from '@ngrx/effects';
import {MeetingEffects} from '@meeting/+state/meeting.effects.service';
import {TranslateModule} from '@ngx-translate/core';
import {VotingModule} from '@voting/voting.module';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {VotingEffects} from '@voting/+state/vote.effects';
import {VotecountMemberListComponent} from './components/votecount-member-list/votecount-member-list.component';
import {RepresentationsListComponent} from './components/representations-list/representations-list.component';
import {CreateAuthorityListComponent} from './components/create-authority-list/create-authority-list.component';
import {MatChipsModule} from '@angular/material/chips';
import {CreateMeetingModalListComponent} from './components/create-meeting-modal-list/create-meeting-modal-list.component';
import {BallotBoxEffects} from '@voting/+state/ballot-box.effects';
import {_MatMenuDirectivesModule, MatMenuModule} from '@angular/material/menu';
import {MeetingSummarySmartComponent} from '@meeting/components/meeting-summary/meeting-summary-smart.component';
import {MeetingSummaryComponent} from '@meeting/components/meeting-summary/meeting-summary.component';
import {MatExpansionModule} from '@angular/material/expansion';
import {DeleteMeetingModalComponent} from './components/delete-meeting-modal/delete-meeting-modal.component';

const COMPONENTS = [
  AuthoritiesListComponent,
  AuthoritiesListSmartComponent,
  MeetingDetailComponent,
  MeetingDetailSmartComponent,
  MeetingOverviewSmartComponent,
  MeetingOverviewComponent,
  MeetingCardComponent,
  MeetingCardSmartComponent,
  MeetingHeaderComponent,
  MeetingHeaderSmartComponent,
  ParticipantsListComponent,
  ParticipantsListSmartComponent,
  VotecountMemberListComponent,
  RepresentationsListComponent,
  CreateAuthorityListComponent,
  CreateMeetingModalListComponent,
  MeetingSummarySmartComponent,
  MeetingSummaryComponent
];

const MODAL_COMPONENTS = [
  CreateMeetingModalComponent,
  CreateAuthorityModalComponent,
  DeleteMeetingModalComponent
];

@NgModule({
  declarations: [COMPONENTS, MODAL_COMPONENTS],
  entryComponents: [MODAL_COMPONENTS],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    NgbModule,
    MeetingRoutingModule,
    CoreModule,
    VotingModule,
    EffectsModule.forFeature([MeetingEffects, VotingEffects, BallotBoxEffects]),
    TranslateModule,
    MatChipsModule,
    _MatMenuDirectivesModule,
    MatMenuModule,
    MatExpansionModule,
  ],
  exports: [COMPONENTS, MODAL_COMPONENTS],
})
export class MeetingModule {
}
