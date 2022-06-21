/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {VoteFacade} from '@voting/services/vote.facade';
import {first, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {UserResult, VoteDetailModel, VoteOption, VoteResult} from '@voting/models/vote.model';
import {combineLatest, ReplaySubject, Subject} from 'rxjs';
import {Observable} from 'rxjs/Observable';
import {User} from '@user/models/user.model';
import {MemberWithVotingCount} from '@meeting/models/meeting-member.model';
import {StorageVote} from '@core/models/storage.model';

@Component({
  selector: 'app-voting-summary-smart',
  template: `
    <app-voting-summary [voteDetail]="voteDetail"
                        [excludedUsers]="excludedUsers"
                        [tooLateMembers]="tooLateMembers"
                        [isAnonymous]="isAnonymous"
                        [templateReady]="templateReady"
                        [results]="results$ | async">
    </app-voting-summary>`
})
export class VotingSummarySmartComponent implements OnInit, OnDestroy {

  @Input() voteAddress: string;
  @Input() meetingAddress: string;
  @Input() isAnonymous: boolean;
  @Input() templateReady: boolean;
  @Output() voteDataReady = new EventEmitter<any>();

  voteDetail: VoteDetailModel;
  results$: Observable<UserResult[] | VoteResult[]>;

  excludedUsers: User[] = [];
  tooLateMembers: User[] = [];
  metadata;
  voteOptions;

  voteResultsReady$ = new ReplaySubject(1);
  excludedMembersReady$ = new ReplaySubject(1);
  tooLateMembersReady$ = new ReplaySubject(1);

  private unsubscribe$ = new Subject();

  constructor(
    private voteFacade: VoteFacade
  ) {
  }

  getResults(): Observable<UserResult[] | VoteResult[]> {
    return combineLatest([
      this.voteFacade.getResolvedMetaDataByAddress(this.voteAddress),
      this.voteFacade.getVoteOptions(this.voteAddress),
    ]).pipe(
      takeUntil(this.unsubscribe$),
      switchMap(([metaData, voteOptions]: [StorageVote, VoteOption]) => {
        this.voteDetail = {
          address: this.voteAddress,
          title: metaData.title,
          description: metaData.description,
          filename: metaData.filename,
          voteOptions
        } as VoteDetailModel;
        return this.isAnonymous ? this.voteFacade.getNotVerifiedResult(this.voteAddress) :
          this.voteFacade.getResultsByVoteDecisionAddress(this.voteAddress).pipe(
            map((userResults: UserResult[]) => userResults)
          );
      }),
      first(),
      tap(() => this.voteResultsReady$.next())
    );
  }

  ngOnInit() {
    this.results$ = this.getResults();

    this.voteFacade.getExcludedFromVoteList(this.voteAddress)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((users: MemberWithVotingCount[]) => {
        this.excludedUsers = users;
        this.excludedMembersReady$.next();
      });

    if (!this.isAnonymous) {
      this.voteFacade.getTooLateRegisteredMemberForVote(this.meetingAddress, this.voteAddress)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe((users: MemberWithVotingCount[]) => {
          this.tooLateMembers = users;
          this.tooLateMembersReady$.next();
        });
    } else {
      this.tooLateMembersReady$.next();
    }

    combineLatest([
      this.voteResultsReady$,
      this.excludedMembersReady$,
      this.tooLateMembersReady$
    ]).pipe(takeUntil(this.unsubscribe$), tap(() => this.voteDataReady.emit())
    ).subscribe();
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
