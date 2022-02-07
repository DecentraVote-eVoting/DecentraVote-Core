/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, Input} from '@angular/core';
import {AssetFiles} from '@core/models/asset.model';
import {MemberWithVotingCount} from '@meeting/models/meeting-member.model';
import {MemberNamePipe} from '@core/pipes/member-name.pipe';

@Component({
  selector: 'app-participants-list',
  templateUrl: './participants-list.component.html'
})
export class ParticipantsListComponent {

  @Input() authoritiesLoading = false;
  // TODO: Actually set this boolean as it is used in the template
  @Input() participantsLoading = false;

  @Input()
  set representees(authorities: MemberWithVotingCount[]) {
    this._representees = authorities;
    this.search();
  }

  get representees(): MemberWithVotingCount[] {
    return this._representees;
  }

  @Input()
  set members(participants: MemberWithVotingCount[]) {
    this._members = participants;
    this.search();
  }

  get members(): MemberWithVotingCount[] {
    return this._members;
  }

  assetFiles = AssetFiles;
  membersFiltered: MemberWithVotingCount[] = [];
  representeesFiltered: MemberWithVotingCount[] = [];
  _representees: MemberWithVotingCount[] = [];
  _members: MemberWithVotingCount[] = [];

  constructor(private memberNamePipe: MemberNamePipe) {
  }

  getTotalVoteCount(): number {
    if ((this.getMembersVoting() || []).length === 0) {
      return 0;
    }

    return this.getMembersVoting()
      .map(member => member.votingCount)
      // Sums up all votingCounts
      .reduce((a, b) => a + b);
  }

  getMembersVoting(): MemberWithVotingCount[] {
    return (this.members || []).filter(p => p.votingCount > 0);
  }

  // returns the members filtered by a search string
  search(searchText: string = '') {
    if (!searchText) {
      this.membersFiltered = this.getMembersVoting();
      this.representeesFiltered = this.representees;
    } else {
      this.membersFiltered = (this.getMembersVoting() || []).filter(voter => {
        const memberString = this.memberNamePipe.transform(voter);
        return memberString.toLowerCase().includes(searchText.toLowerCase());
      });
      this.representeesFiltered = (this.representees || []).filter(voter => {
        const memberString = this.memberNamePipe.transform(voter);
        return memberString.toLowerCase().includes(searchText.toLowerCase());
      });
    }
  }

}
