/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {StorageVotingOption} from '@core/models/storage.model';
import {VoteDetailTab, VoteResult} from '@voting/models/vote.model';
import {ResolvedClaim} from '@user/models/user.model';
import {Subject} from 'rxjs';

interface InvalidUserWithOption {
  option: string;
  userClaim: ResolvedClaim;
}

@Component({
  selector: 'app-vote-verification',
  templateUrl: './vote-verification.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoteVerificationComponent implements OnInit {

  @Input() title = '';
  @Input() verifyProofSupported = true;
  @Input() validBallotCount = 0;
  @Input() invalidBallotCount = 0;
  @Input() isAnonymous: boolean;
  @Input() percentage = 0;
  @Input() options: StorageVotingOption[] = [];
  @Input() ballotCount = 0;
  @Input() validResult: VoteResult[] = [];
  @Input() invalidResult: VoteResult[] = [];
  @Input() updateDetailEvent$: Subject<InvalidUserWithOption>;
  @Input() invalidOptionsWithUser: { option: string, userClaim: ResolvedClaim }[] = [];

  @Output() closeWindowAction = new EventEmitter();

  voteDetailTab = VoteDetailTab;
  activeTab: VoteDetailTab = VoteDetailTab.RESULT_OVERVIEW;

  invalidOptionsByUser: { [key: string]: { userClaim: ResolvedClaim, options: string[] } } = {};

  constructor() {
  }

  ngOnInit() {
    this.updateDetailEvent$.subscribe(invalidUserWithOption => this.formatInvalidOptionsByUser(invalidUserWithOption));
  }

  formatInvalidOptionsByUser(invalidUserWithOption: InvalidUserWithOption) {
    const key = invalidUserWithOption.userClaim.uid;
    if (this.invalidOptionsByUser[key] === undefined) {
      this.invalidOptionsByUser[key] = {
        userClaim: invalidUserWithOption.userClaim,
        options: [invalidUserWithOption.option]
      };
    } else {
      this.invalidOptionsByUser[key].options.push(invalidUserWithOption.option);
    }
  }

  showInvalidBallots(): boolean {
    if (this.isAnonymous === undefined) {
      return false;
    }
    return !this.isAnonymous && this.invalidBallotCount > 0;
  }

  getResultByOption(option: string): number {
    const result = (this.validResult || []).find(r => r.name === option);
    return (result) ? result.value : 0;
  }

  getInvalidResultByOption(option: string): number {
    const result = (this.invalidResult || []).find(r => r.name === option);
    return (result) ? result.value : 0;
  }

  onTabChange(tab: VoteDetailTab) {
    this.activeTab = tab;
  }

}
