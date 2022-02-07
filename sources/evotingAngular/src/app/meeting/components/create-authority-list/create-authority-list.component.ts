/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, EventEmitter, Input, OnDestroy, Output} from '@angular/core';
import {Subject} from 'rxjs';
import {MemberWithPotentialVotingCount} from '@meeting/models/meeting-member.model';
import {MemberNamePipe} from '@core/pipes/member-name.pipe';

@Component({
  selector: 'app-create-authority-list',
  templateUrl: './create-authority-list.component.html',
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
    }
  `]
})
export class CreateAuthorityListComponent implements OnDestroy {
  @Input() selectedMember: MemberWithPotentialVotingCount;

  @Input()
  set members(members: MemberWithPotentialVotingCount[]) {
    this._members = members;
    this.search();
  }

  @Output() selectAction = new EventEmitter<MemberWithPotentialVotingCount>();

  _members: MemberWithPotentialVotingCount[] = [];
  filteredMembers: MemberWithPotentialVotingCount[] = [];
  private unsubscribe$ = new Subject();

  constructor(private memberNamePipe: MemberNamePipe) {
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  search(searchText: string = '') {
    if (!searchText) {
      this.filteredMembers = this._members;
    } else {
      this.filteredMembers = this._members.filter(member => {
        const memberString = this.memberNamePipe.transform(member);
        return memberString.toLowerCase().includes(searchText.toLowerCase());
      });
    }
  }

  onSelect(member: MemberWithPotentialVotingCount) {
    this.selectedMember = member;
    this.selectAction.emit(member);
  }

  formatVotingCount(votingCount: number, potentialVotingCount: number) {
    return potentialVotingCount;
  }
}
