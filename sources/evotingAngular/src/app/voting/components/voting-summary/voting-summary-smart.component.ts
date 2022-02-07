/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {VoteFacade} from '@voting/services/vote.facade';
import {first, map, switchMap, tap} from 'rxjs/operators';
import {ExportVoteResult, UserResult, VoteDetailModel, VoteResult} from '@voting/models/vote.model';
import {combineLatest, ReplaySubject} from 'rxjs';
import {Observable} from 'rxjs/Observable';
import {User} from '@user/models/user.model';

@Component({
  selector: 'app-voting-summary-smart',
  template: `
    <app-voting-summary [voteDetail]="voteDetail"
                        [excludedUsers]="excludedUsers"
                        [nonExcludedUsers]="nonExcludedUsers"
                        [isAnonymous]="isAnonymous"
                        [templateReady]="templateReady"
                        [results]="results$ | async">
    </app-voting-summary>`
})
export class VotingSummarySmartComponent implements OnInit {

  @Input() voteAddress: string;
  @Input() isAnonymous: boolean;
  @Input() templateReady: boolean;
  @Output() voteDataReady = new EventEmitter<any>();

  voteDetail: VoteDetailModel;
  results$: Observable<UserResult[] | VoteResult[]>;

  excludedUsers: User[] = [];
  nonExcludedUsers: User[] = [];
  metadata;
  voteOptions;

  voteResultsReady$ = new ReplaySubject(1);
  excludedMembersReady$ = new ReplaySubject(1);
  nonExcludedMembersReady$ = new ReplaySubject(1);

  constructor(
    private voteFacade: VoteFacade,
  ) {}

  getResults(): Observable<UserResult[] | VoteResult[]> {
    return combineLatest([
      this.voteFacade.getResolvedMetaDataByAddress(this.voteAddress),
      this.voteFacade.getVoteOptions(this.voteAddress),
    ]).pipe(
      switchMap(([metaData, voteOptions]) => {
        this.voteDetail = {
          address: this.voteAddress,
          title: metaData.title,
          description: metaData.description,
          filename: metaData.filename,
          voteOptions
        } as VoteDetailModel;
        return this.isAnonymous ? this.voteFacade.getNotVerifiedResult(this.voteAddress) :
          this.voteFacade.getResultsByVoteDecisionAddress(this.voteDetail).pipe(
            map((exportVoteResult: ExportVoteResult) => exportVoteResult.userResults)
          );
      }),
      first(),
      tap(() => this.voteResultsReady$.next())
    );
  }

  ngOnInit() {
    this.results$ = this.getResults();

    this.voteFacade.getExcludedFromVoteList(this.voteAddress)
      .pipe(first())
      .subscribe(users => {
        this.excludedUsers = users;
        this.excludedMembersReady$.next();
      });

    this.voteFacade.getNonExcludedVoters(this.voteAddress)
      .pipe(first(), tap())
      .subscribe(users => {
        this.nonExcludedUsers = users;
        this.nonExcludedMembersReady$.next();
      });

    combineLatest([
      this.voteResultsReady$,
      this.excludedMembersReady$,
      this.nonExcludedMembersReady$
    ]).pipe(first(), tap(() => this.voteDataReady.emit())
    ).subscribe();
  }
}
