/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ModalService} from '@core/services/modal.service';
import {PermissionService} from '@core/services/permission.service';
import {Permission} from '@core/models/permission.model';
import {VoteCardModel} from '@voting/models/vote.model';
import {VoteStage} from '@voting/models/vote-stage.enum';
import {MeetingDetailModel, MeetingStage} from '@meeting/models/meeting.model';
import {forkJoin, Subject, Subscription, timer} from 'rxjs';
import {User} from '@app/user/models/user.model';
import {Observable} from 'rxjs/Observable';
import {BallotBoxService} from '@core/services/ballot-box.service';
import {first, takeUntil, tap} from 'rxjs/operators';
import {VoteFacade} from '@voting/services/vote.facade';
import {CreateVotingModalComponent} from '@voting/components/create-voting-modal/create-voting-modal.component';
import {LocalStorageUtil} from "@core/utils/local-storage.util";

@Component({
  selector: 'app-voting-card',
  templateUrl: './voting-card.component.html'
})
export class VotingCardComponent implements OnInit, OnDestroy {

  @Input() vote: VoteCardModel;
  @Input() meeting: MeetingDetailModel;

  // TODO evaluate... what do we need here?
  @Input() chairperson: User;
  @Input() userIsChairperson = false;
  @Input() isVoteArchived: boolean;
  @Input() isVoteLoading: boolean;
  @Input() isProcessingVotes: boolean;
  @Input() showVoteIcon: boolean;
  @Input() isSortingModeActive: boolean;

  // Below are used
  @Input() userIsDirector = false;
  @Input() castedVotes$: Observable<number>;
  @Input() isVoteOpened$: Subject<any>;
  @Input() isVoteFinished$: Subject<any>;

  @Output() openVoteAction = new EventEmitter();
  @Output() closeVoteAction = new EventEmitter();
  @Output() finishVoteAction = new EventEmitter();
  @Output() openArchiveVoteModal = new EventEmitter();
  @Output() openVotingModal = new EventEmitter();
  @Output() openParticipantsModal = new EventEmitter();
  @Output() openDeleteModal = new EventEmitter();
  @Output() openVoteCertificate = new EventEmitter();

  voteStage = VoteStage;
  meetingStage = MeetingStage;
  permission = Permission;

  // only visible for chairperson
  castedVotesWhileOpen;
  private endAutoBallotRefresh$ = new Subscription();
  private unsubscribe$ = new Subject();

  constructor(
    private voteFacade: VoteFacade,
    private modalService: ModalService,
    private permissionService: PermissionService,
    private ballotBoxService: BallotBoxService) {
  }

  ngOnInit() {
    if (this.userIsChairperson && this.vote.stage < VoteStage.COUNTED) {
      if (this.vote.stage === VoteStage.CREATED) {
        this.isVoteOpened$.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
          this.subscribeToVotes();
        });
      } else {
        this.subscribeToVotes();
      }
    } else {
      this.endAutoBallotRefresh$.unsubscribe();
    }
  }

  subscribeToVotes() {
    this.endAutoBallotRefresh$ = timer(0, 10000).pipe(
      takeUntil(this.isVoteFinished$)
    ).subscribe(_ => {
      this.ballotBoxService.getAllCastedVotes(this.vote.address, this.vote.isAnonymous).pipe(
        takeUntil(this.isVoteFinished$)
      ).subscribe((value: number) => {
        if (value) {
          this.castedVotesWhileOpen = value;
        }
      });
    });
  }

  openChangeRequestVoteModal() {
    forkJoin([
      this.voteFacade.getAttachment(this.vote.address).pipe(first()),
      this.voteFacade.getResolvedMetaDataByAddress(this.vote.address).pipe(first()),
      this.voteFacade.getVoteOptions(this.vote.address).pipe(first())
    ]).pipe(
      first(),
      tap(([attachment, metaData, options]) => {
        this.modalService.openModal<CreateVotingModalComponent>(CreateVotingModalComponent,
          {
            prefillData: {
              address: this.vote.address,
              meetingAddress: this.meeting.address,
              title: this.vote.title,
              description: this.vote.description,
              isAnonymous: this.vote.isAnonymous,
              attachment: attachment ? new File([attachment], metaData.filename) : null,
              filename: metaData.filename,
              voteOptions: options
            },
            close: true
          });
      })
    ).subscribe();
  }

  openEditVotingModal() {
    forkJoin([
      this.voteFacade.getAttachment(this.vote.address).pipe(first()),
      this.voteFacade.getResolvedMetaDataByAddress(this.vote.address).pipe(first()),
      this.voteFacade.getVoteOptions(this.vote.address).pipe(first())
    ]).pipe(
      first(),
      tap(([attachment, metaData, options]) => {
        this.modalService.openModal<CreateVotingModalComponent>(CreateVotingModalComponent,
          {
            prefillData: {
              address: this.vote.address,
              meetingAddress: this.meeting.address,
              title: this.vote.title,
              description: this.vote.description,
              isAnonymous: this.vote.isAnonymous,
              attachment: attachment ? new File([attachment], metaData.filename) : null,
              filename: metaData.filename,
              voteOptions: options
            },
            isEdit: true,
            close: true
          });
      })
    ).subscribe();
  }



  showCreateVoting(): boolean {
    return this.permissionService.check(Permission.VOTING_CREATE, this.meeting, this.vote);
  }

  showVotingDescription(): boolean {
    return !this.isSortingModeActive;
  }

  showVotingCount(): boolean {
    return this.permissionService.check(Permission.VOTING_SHOW_VOTE_COUNT, this.meeting, this.vote)
      && !this.isSortingModeActive;
  }

  showVotingInteractions(): boolean {
    return !this.isSortingModeActive;
  }

  showVotingEdit(): boolean {
    return this.permissionService.check(Permission.VOTING_EDIT, this.meeting, this.vote);
  }

  showVotingDelete(): boolean {
    return this.permissionService.check(Permission.VOTING_DELETE, this.meeting, this.vote);
  }

  showVotingOptions(): boolean {
    return this.permissionService.check(Permission.VOTING_PROCESS_OPTIONS, this.meeting, this.vote);
  }

  showVotingOpen(): boolean {
    return this.permissionService.check(Permission.VOTING_OPEN, this.meeting, this.vote);
  }

  showVotingClose(): boolean {
    return this.permissionService.check(Permission.VOTING_CLOSE, this.meeting, this.vote);
  }

  showVotingArchive(): boolean {
    return this.permissionService.check(Permission.VOTING_ARCHIVE, this.meeting, this.vote);
  }

  showVotingFinish(): boolean {
    return this.permissionService.check(Permission.VOTING_FINISH, this.meeting, this.vote) && !this.isProcessingVotes;
  }

  showVotingIcon(): boolean {
    return this.permissionService.check(Permission.VOTING_SHOW_ICON, this.meeting, this.vote)
      && this.vote.numberOfOwnVoteRights > 0
      && this.vote.numberOfOwnVoteRights - this.vote.numberOfOwnVotesCast === 0;
  }

  showIsProcessingVotesBuffer() {
    return this.vote.stage === VoteStage.CLOSED && this.isProcessingVotes;
  }

  showCertificate() {
    return this.permissionService.check(Permission.VOTING_CERTIFICATE, this.meeting, this.vote)
      && (LocalStorageUtil.localItemExist(this.vote.address) || this.vote.numberOfOwnVotesCast > 0);
  }

  ngOnDestroy() {
    this.endAutoBallotRefresh$.unsubscribe();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
