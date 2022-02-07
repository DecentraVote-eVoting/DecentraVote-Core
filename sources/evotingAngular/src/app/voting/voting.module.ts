/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {VotingOverviewSmartComponent} from '@voting/components/voting-overview/voting-overview-smart.component';
import {VotingOverviewComponent} from '@voting/components/voting-overview/voting-overview.component';
import {VotingCardComponent} from '@voting/components/voting-card/voting-card.component';
import {VotingCardSmartComponent} from '@voting/components/voting-card/voting-card-smart.component';
import {VotingDetailModalComponent} from '@voting/components/voting-detail-modal/voting-detail-modal.component';
import {VotingDetailMainContentComponent} from '@voting/components/voting-detail-modal/voting-detail-main-content/voting-detail-main-content.component';
import {ArchiveVotingModalComponent} from '@voting/components/archive-voting-modal/archive-voting-modal.component';
import {VotingParticipantsListModalComponent} from '@voting/components/voting-participants-list-modal/voting-participants-list-modal.component';
import {CreateVotingModalComponent} from '@voting/components/create-voting-modal/create-voting-modal.component';
import {VotingDetailModalSmartComponent} from '@voting/components/voting-detail-modal/voting-detail-modal-smart.component';
import {CoreModule} from '@core/core.module';
import {TranslateModule} from '@ngx-translate/core';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {RouterModule} from '@angular/router';
import {SortablejsModule} from 'ngx-sortablejs';
import {DeleteVotingModalComponent} from './components/delete-voting-modal/delete-voting-modal.component';
import {SaveSortingModalComponent} from './components/save-sorting-modal/save-sorting-modal.component';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {VotingDetailResultListComponent} from './components/voting-detail-modal/voting-detail-result-list/voting-detail-result-list.component';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {VotingDetailResultListSmartComponent} from '@voting/components/voting-detail-modal/voting-detail-result-list/voting-detail-result-list-smart.component';
import {VotingParticipantsListModalListComponent} from './components/voting-participants-list-modal-list/voting-participants-list-modal-list.component';
import {PortalModule} from '@angular/cdk/portal';
import {EffectsModule} from '@ngrx/effects';
import {VotingEffects} from '@voting/+state/vote.effects';
import {BallotBoxEffects} from '@voting/+state/ballot-box.effects';
import {VoteVerificationSmartComponent} from '@voting/components/vote-verification/vote-verification-smart.component';
import {VoteVerificationComponent} from './components/vote-verification/vote-verification.component';
import {NgCircleProgressModule} from 'ng-circle-progress';
import {VotingSummarySmartComponent} from './components/voting-summary/voting-summary-smart.component';
import {VotingSummaryComponent} from '@voting/components/voting-summary/voting-summary.component';

const COMPONENTS = [
  VotingOverviewSmartComponent,
  VotingOverviewComponent,
  VotingCardComponent,
  VotingCardSmartComponent,
  VotingDetailModalComponent,
  VotingDetailMainContentComponent,
  VotingDetailResultListComponent,
  VotingDetailResultListSmartComponent,
  VotingParticipantsListModalListComponent,
  VoteVerificationSmartComponent,
  VoteVerificationComponent,
  VotingSummarySmartComponent,
  VotingSummaryComponent,
];

const MODAL_COMPONENTS = [
  VotingDetailModalSmartComponent,
  CreateVotingModalComponent,
  VotingParticipantsListModalComponent,
  ArchiveVotingModalComponent,
  DeleteVotingModalComponent,
  SaveSortingModalComponent
];

@NgModule({
  declarations: [
    COMPONENTS,
    MODAL_COMPONENTS,
    VoteVerificationComponent,
    VotingSummarySmartComponent,
  ],
  entryComponents: [
    MODAL_COMPONENTS
  ],
  imports: [
    CommonModule,
    NgbModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    RouterModule,
    CoreModule,
    TranslateModule,
    SortablejsModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatButtonToggleModule,
    PortalModule,
    EffectsModule.forFeature([VotingEffects, BallotBoxEffects]),
    NgCircleProgressModule,
  ],
  exports: [COMPONENTS, MODAL_COMPONENTS],
})
export class VotingModule {
}
