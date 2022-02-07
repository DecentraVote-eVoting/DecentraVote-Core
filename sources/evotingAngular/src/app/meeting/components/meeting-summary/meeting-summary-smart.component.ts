/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, OnInit} from '@angular/core';
import {MeetingDetailModel} from '@meeting/models/meeting.model';
import {SessionStorageUtil} from '@core/utils/session-storage.util';
import {EthersService} from '@core/services/ethers.service';
import {combineLatest, from, Observable, of, ReplaySubject, zip} from 'rxjs';
import {concatMap, distinctUntilChanged, filter, first, map, tap, toArray} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';
import {MeetingFacade} from '@meeting/services/meeting.facade';
import {MemberRepresentation} from '@meeting/models/meeting-member.model';
import * as meetingActions from '@meeting/+state/meeting.actions';
import {Store} from '@ngrx/store';
import * as fromRoot from '@app/app.store';
import {VoteFacade} from '@voting/services/vote.facade';
import * as voteActions from '@voting/+state/vote.actions';
import {VoteStage} from '@voting/models/vote-stage.enum';
import {deepDistinctUntilChanged} from '@core/utils/pipe.util';

@Component({
  selector: 'app-meeting-summary-smart',
  template: `
    <app-meeting-summary [meeting]="meeting"
                         [representations]="representations"
                         [countedVoteAddresses]="countedVoteAddresses$ | async"
                         [templateReady]="templateReady$ | async"
                         (voteDataReady)="checkAllVotesReady()">
    </app-meeting-summary>`
})
export class MeetingSummarySmartComponent implements OnInit {
  meeting: MeetingDetailModel;
  representations: MemberRepresentation[];
  countedVoteAddresses$: Observable<{ voteAddress: string, isAnonymous: boolean }[]>;
  numberOfCountedVotes = 0;

  meetingReady$ = new ReplaySubject(1);
  representationsReady$ = new ReplaySubject(1);
  countedVoteAddressesReady$ = new ReplaySubject(1);
  votesReady$ = new ReplaySubject(1);
  votesReadyCount = 0;

  templateReady$: Observable<boolean> = combineLatest([
    this.meetingReady$,
    this.representationsReady$,
    this.countedVoteAddressesReady$,
    this.votesReady$
  ]).pipe(map(() => true));

  constructor(
    private route: ActivatedRoute,
    private ethersService: EthersService,
    private meetingFacade: MeetingFacade,
    private store: Store<fromRoot.State>,
    private voteFacade: VoteFacade) {
  }

  ngOnInit() {
    const meetingAddress = this.route.snapshot.params.meetingAddress;

    this.ethersService.createSigner(SessionStorageUtil.getMnemonic());

    this.store.dispatch(meetingActions.GetMeetingDetailAction({address: meetingAddress}));

    this.meetingFacade.getMeetingDetailModel(meetingAddress)
      .pipe(distinctUntilChanged(), first())
      .subscribe(meeting => {
        this.meeting = meeting;
        this.meetingReady$.next();
        if (this.meeting.votes.length === 0) { this.votesReady$.next(); }
        this.countedVoteAddresses$ = this.getCountedVoteAddresses();
      });

    this.meetingFacade.getMemberRepresentations(meetingAddress)
      .pipe(deepDistinctUntilChanged(), first())
      .subscribe(representations => {
        this.representations = representations;
        this.representationsReady$.next();
      });
  }

  getCountedVoteAddresses(): Observable<{ voteAddress: string, isAnonymous: boolean }[]> {
    return from(this.meeting.votes).pipe(
      tap(voteAddress => this.store.dispatch(voteActions.GetVoteDetailAction({voteAddress}))),
      concatMap(voteAddress => zip(
        of(voteAddress),
        this.voteFacade.getVoteStage(voteAddress),
        this.voteFacade.getIsAnonymousByVoteAddress(voteAddress)
      )),
      filter(([_, voteStage, __]) => voteStage === VoteStage.COUNTED),
      map(([voteAddress, _, isAnonymous]) => ({voteAddress, isAnonymous})),
      toArray(),
      first(),
      tap(countedVoteAddresses => {
        this.numberOfCountedVotes = countedVoteAddresses.length;
        this.countedVoteAddressesReady$.next();
        if (this.numberOfCountedVotes === 0) { this.votesReady$.next(); }
      })
    );
  }

  checkAllVotesReady() {
    if (++this.votesReadyCount === this.numberOfCountedVotes) {
      this.votesReady$.next();
    }
  }
}
