/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {VoteFacade} from '@voting/services/vote.facade';
import {VoteCardModel} from '@voting/models/vote.model';
import {MeetingDetailModel} from '@meeting/models/meeting.model';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {Observable} from 'rxjs/Observable';
import {User} from '@app/user/models/user.model';
import {Store} from '@ngrx/store';
import {ConfirmationDialogModalComponent} from '@core/components/confirmation-dialog-modal/confirmation-dialog-modal.component';
import {ModalService} from '@core/services/modal.service';
import {ArchiveVotingModalComponent} from '@voting/components/archive-voting-modal/archive-voting-modal.component';
import {VotingDetailModalSmartComponent} from '@voting/components/voting-detail-modal/voting-detail-modal-smart.component';
import {VotingParticipantsListModalComponent} from '@voting/components/voting-participants-list-modal/voting-participants-list-modal.component';
import {DeleteVotingModalComponent} from '@voting/components/delete-voting-modal/delete-voting-modal.component';

@Component({
  selector: 'app-voting-card-smart',
  template: `
    <ng-container *ngIf="voteCardModel != undefined">
      <app-voting-card [vote]="voteCardModel"
                       [meeting]="meeting"
                       [chairperson]="chairperson"
                       [userIsDirector]="userIsDirector"
                       [userIsChairperson]="userIsChairperson"
                       [isVoteArchived]="isVoteArchived$ | async"
                       [isVoteLoading]="isVoteLoading$ | async"
                       [isProcessingVotes]="isProcessingVotes$ | async"
                       [showVoteIcon]="showVoteIcon"
                       [isSortingModeActive]="isSortingModeActive"
                       [isVoteOpened$]="isVoteOpened$"
                       [isVoteFinished$]="isVoteFinished$"
                       (openVoteAction)="this.onOpenVote()"
                       (closeVoteAction)="this.onCloseVote()"
                       (finishVoteAction)="this.onFinishVote()"
                       (openArchiveVoteModal)="this.openArchiveVoteModal()"
                       (openVotingModal)="this.openVotingModal()"
                       (openParticipantsModal)="this.openParticipantsModal()"
                       (openDeleteModal)="this.openDeleteModal()"
                       (openVoteCertificate)="this.openVoteCertificate()"
      >
      </app-voting-card>
    </ng-container>
  `
})
export class VotingCardSmartComponent implements OnInit, OnDestroy {

  @Input() voteAddress: string;
  @Input() meeting: MeetingDetailModel;
  @Input() chairperson: User;
  @Input() userIsChairperson = false;
  @Input() userIsDirector = false;
  @Input() isSortingModeActive: boolean;

  showVoteIcon: boolean;
  voteCardModel: VoteCardModel;

  isVoteArchived$: Observable<boolean>;
  isVoteLoading$: Observable<boolean>;
  isProcessingVotes$: Observable<boolean>;
  isVoteOpened$ = new Subject();
  isVoteFinished$ = new Subject();

  private unsubscribe$ = new Subject();

  constructor(private voteFacade: VoteFacade,
              private cdr: ChangeDetectorRef,
              private store: Store<any>,
              private modalService: ModalService) {
  }

  ngOnInit() {
    this.isVoteArchived$ = this.voteFacade.getVoteArchiveState(this.voteAddress);
    this.isVoteLoading$ = this.voteFacade.getVoteLoadingState(this.voteAddress);
    this.isProcessingVotes$ = this.voteFacade.getIsProcessingVotes(this.voteAddress);
    this.voteFacade.getVoteCardModelByAddress(this.voteAddress)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(voteCardModel => {
        this.voteCardModel = voteCardModel;
        this.cdr.detectChanges();
      });
  }

  onOpenVote() {
    this.modalService.openModal<ConfirmationDialogModalComponent>(ConfirmationDialogModalComponent, {
      modalCallback: (confirmed: boolean) => {
        if (confirmed) {
          this.voteFacade.openVoting(this.voteCardModel);
          this.isVoteOpened$.next();
          this.isVoteOpened$.complete();
        }
      },
      headerText: 'Confirmation-Modal.Vote.Open.Header',
      dialogText: 'Confirmation-Modal.Vote.Open.Info',
      consequenceTexts: [
        'Confirmation-Modal.Vote.Open.Consequences.Change-Vote',
        'Confirmation-Modal.Vote.Open.Consequences.Vote-Late'
      ],
      close: true
    });
  }

  onCloseVote() {
    this.voteFacade.closeVote(this.voteCardModel);
  }

  onFinishVote() {
    this.voteFacade.finishVote(this.voteCardModel);
    this.isVoteFinished$.next();
    this.isVoteFinished$.complete();
  }

  openVotingModal() {
    this.modalService.openModal<VotingDetailModalSmartComponent>(VotingDetailModalSmartComponent, {
      voteCardModel: this.voteCardModel,
      meeting: this.meeting,
      close: true
    });
  }

  openDeleteModal() {
    this.modalService.openModal<DeleteVotingModalComponent>(DeleteVotingModalComponent, {
      voteModel: this.voteCardModel,
      close: true,
    });
  }

  openArchiveVoteModal() {
    this.modalService.openModal<ArchiveVotingModalComponent>(ArchiveVotingModalComponent, {
      voteModel: this.voteCardModel,
      close: true,
    });
  }

  openParticipantsModal() {
    this.modalService.openModal<VotingParticipantsListModalComponent>(VotingParticipantsListModalComponent,
      {
        meeting: this.meeting,
        vote: this.voteCardModel
      });
  }

  openVoteCertificate() {
    window.open(`./#/certificate/${this.meeting.address}/${this.voteAddress}`,
      '_blank',
      `height=${screen.height / 1.2},width=${screen.width / 1.5}`);
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
