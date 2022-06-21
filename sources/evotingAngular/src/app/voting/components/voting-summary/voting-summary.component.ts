/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, Input} from '@angular/core';
import {UserResult, VoteDetailModel, VoteResult} from '@voting/models/vote.model';
import {VoteStage} from '@voting/models/vote-stage.enum';
import {User} from '@user/models/user.model';
import {UserSortPipe} from '@core/pipes/user-sort.pipe';

@Component({
  selector: 'app-voting-summary',
  templateUrl: './voting-summary.component.html',
})
export class VotingSummaryComponent {

  @Input() voteDetail: VoteDetailModel;
  @Input() isAnonymous: boolean;
  @Input() templateReady: boolean;
  @Input()
  set results(results: UserResult[] | VoteResult[]) {
    if (!results) { return; }
    // check if UserResult[]
    if (results.length > 0 && (results as UserResult[])[0].ethAddress) {
      results = (results as UserResult[]);
      results = this.userSortPipe.transform(results, 0);
      const usersByOption: { [key: string]: User[] } = {};
      results.forEach((userResult) => {
        userResult.options.forEach((option) => {
          const user = this.userResultToUser(userResult);
          (usersByOption[option] = usersByOption[option] || []).push(user);
        });
      });
      Object.keys(usersByOption).forEach(option => {
        this.usersByOptionSplit[option] = this.getSplitLists(usersByOption[option], this.nColumnsResults);
      });
    }
    this._results = results;
  }
  get results(): UserResult[] | VoteResult[] {
    return this._results;
  }

  @Input()
  set excludedUsers(users: User[]) {
    if (!users) { return; }
    users = this.userSortPipe.transform(users, 0);
    this.excludedUsersSplit = this.getSplitLists(users);
  }
  @Input()
  set tooLateMembers(users: User[]) {
    if (!users) { return; }
    users = this.userSortPipe.transform(users, 0);
    this.tooLateMembersSplit = this.getSplitLists(users);
  }

  nColumnsMembers = 3;
  nColumnsResults = 5;

  usersByOptionSplit: { [key: string]: User[][] } = {};
  tooLateMembersSplit: User[][] = [];
  excludedUsersSplit: User[][] = [];
  _results: UserResult[] | VoteResult[];

  voteStage = VoteStage;

  constructor(private userSortPipe: UserSortPipe) {
  }

  optionHasUserResults(option: string): boolean {
    return (this.results as UserResult[]).filter(result => result.options.includes(option)).length > 0;
  }

  getOpenResultsByOption(option: string): number {
    return (this.results as UserResult[])
      .map(result => result.options.filter(opt => opt === option).length)
      .reduce((partial_sum, count) => partial_sum + count, 0);
  }

  getSplitLists(list: any[], nSplits: number = this.nColumnsMembers): any[][] {
    const splitLists: any[][] = [];
    list.forEach((item, index) => {
      (splitLists[index % nSplits] = splitLists[index % nSplits] || []).push(item);
    });
    return splitLists;
  }

  userResultToUser(userResult: UserResult): User {
    return {
      address: userResult.ethAddress,
      resolvedClaim: {
        uid: userResult.uid,
        name1: userResult.name1,
        name2: userResult.name2
      },
      claimHash: null,
      role: null
    } as User;
  }
}
