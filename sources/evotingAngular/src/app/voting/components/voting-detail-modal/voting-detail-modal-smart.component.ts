/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {map, takeUntil, withLatestFrom} from 'rxjs/operators';
import {MeetingDetailModel} from '@meeting/models/meeting.model';
import {VoteFacade} from '@voting/services/vote.facade';
import {VoteCardModel, VoteDetailModel} from '@voting/models/vote.model';
import {PlatformLocation} from '@angular/common';
import {Observable} from 'rxjs/Observable';

@Component({
  selector: 'app-voting-detail-modal-smart',
  template: `
    <app-voting-detail-modal [vote]="vote"
                             [meeting]="meeting"
                             [close]="close"
                             [castVoteLoading]="castVoteLoading$ | async"
                             (castVoteAction)="onCastVote($event)"
                             (verifyVotesAction)="onOpenVerifyVotes()">
    </app-voting-detail-modal>
  `
})
export class VotingDetailModalSmartComponent extends AbstractModalComponent implements OnInit, OnDestroy {

  set meeting(meeting: MeetingDetailModel) {
    if (meeting) {
      this._meeting = meeting;
    }
  }
  get meeting(): MeetingDetailModel {
    return this._meeting;
  }

  @Input() voteCardModel: VoteCardModel;
  vote: VoteDetailModel;

  castVoteLoading$: Observable<boolean>;
  isVerifyingVotes$: Observable<boolean>;

  openVerifyVotes = false;

  private _meeting: MeetingDetailModel;
  private unsubscribe$ = new Subject();
  private checkCastVoteReadySubject$ = new BehaviorSubject('');

  constructor(protected modalRef: NgbActiveModal,
              private voteFacade: VoteFacade,
              private platform: PlatformLocation,
              private cdr: ChangeDetectorRef
              ) {
    super(modalRef, platform);
  }

  ngOnInit() {
    this.castVoteLoading$ = this.checkCastVoteReadySubject$.pipe(
      withLatestFrom(this.voteFacade.getCastVoteLoading(this.voteCardModel.address)),
      map(([checkReady, castVoteLoading]) => {
        return castVoteLoading || false;
      })
    );
    this.isVerifyingVotes$ = this.voteFacade.getIsVerifyingVotes(this.voteCardModel.address);

    this.voteFacade.getVoteDetailModelByAddress(this.voteCardModel.address).pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( (val: VoteDetailModel) => {
      this.vote = val;
      this.checkCastVoteReadySubject$.next('');
    });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onCastVote(votingOptions: [string[], number]) {
    this.voteFacade.vote(votingOptions[0], votingOptions[1], this.vote.address);
    this.checkCastVoteReadySubject$.next('');
  }

  onOpenVerifyVotes() {
     window.open(`./#/verification/${this.vote.meetingAddress}/${this.vote.address}`,
        '_blank',
        `height=${screen.height / 2},width=${screen.width / 4}`);
  }
}
