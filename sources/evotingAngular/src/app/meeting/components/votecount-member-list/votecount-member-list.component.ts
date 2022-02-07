/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, HostListener, Input} from '@angular/core';
import {MemberWithVotingCount} from '@meeting/models/meeting-member.model';

@Component({
  selector: 'app-votecount-member-list',
  templateUrl: './votecount-member-list.component.html',
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
    }
  `]
})
export class VotecountMemberListComponent {

  @Input()
  set membersWithVotingCount(membersWithVotingCount: MemberWithVotingCount[]) {
    this._membersWithVotingCount = membersWithVotingCount;
    this.processUserListCells();
  }

  @Input()
  set representeesCount(_representeesCount: MemberWithVotingCount[]) {
    this._representeesCount = _representeesCount;
    this.processUserListCells();
  }

  page: number = 1;
  pageSize = 10;

  paginationArray: MemberWithVotingCount[][];
  screenWidth: number;
  _membersWithVotingCount: MemberWithVotingCount[];
  _representeesCount: MemberWithVotingCount[];
  userListCells: MemberWithVotingCount[];

  constructor() {
    this.onResize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?) {
    this.screenWidth = window.innerWidth;
  }

  processUserListCells() {
    this.userListCells = [];

    if (this._membersWithVotingCount) {
      this._membersWithVotingCount.forEach(member => {
        this.userListCells.push(member);
      });
    }
    if (this._representeesCount) {
      this._representeesCount.forEach(representee => {
        this.userListCells.push(representee);
      });
    }
    if (this.userListCells.length <= this.pageSize) this.page = 1;
  }

  getArray(pageNumber: number, usePagination: boolean): MemberWithVotingCount[] {
    pageNumber -= 1;
    if (usePagination) {
      return this.userListCells.slice(pageNumber * this.pageSize, (pageNumber + 1) * this.pageSize);
    } else {
      return this.userListCells;
    }
  }
}
