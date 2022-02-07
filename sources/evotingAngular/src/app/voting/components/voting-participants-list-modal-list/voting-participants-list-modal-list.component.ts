/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {User} from '@app/user/models/user.model';
import {MemberNamePipe} from '@core/pipes/member-name.pipe';

@Component({
  selector: 'app-voting-participants-list-modal-list',
  templateUrl: './voting-participants-list-modal-list.component.html',
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
    }
  `]
})
export class VotingParticipantsListModalListComponent {

  @Input() changesAllowed = false;
  @Input() icon = '';

  @Input()
  set members(members: User[]) {
    this._members = members;
    this.filteredMembers = members;
    this.search(this.searchText);
  }

  get members() {
    return this._members;
  }

  @Input() excludedMembersLoading: string[];

  @Output() iconClickedAction = new EventEmitter<User>();

  searchText = '';
  filteredMembers: User[] = [];
  private _members: User[] = [];
  paginationArray: User[][] = [];
  pageSize = 10;
  page = 1;
  screenWidth: number;

  @HostListener('window:resize', ['$event'])
  onResize(event?) {
    this.screenWidth = window.innerWidth;
  }

  constructor(private memberNamePipe: MemberNamePipe) {
    this.onResize();
  }

  search(searchText: string) {
    this.searchText = searchText;
    if (!searchText) {
      this.filteredMembers = this.members;
    } else {
      this.page = 1;
      this.filteredMembers = (this.members || [])
        .filter(votingMember => this.memberNamePipe.transform(votingMember).toLowerCase().includes(searchText.toLowerCase()));
    }
  }

  sortMembers() {
    this.filteredMembers = this.filteredMembers.sort((cell1, cell2) =>
      cell1.resolvedClaim.field1.localeCompare(cell2.resolvedClaim.field1));
  }

  getArray(pageNumber: number, usePagination: boolean): User[] {
    this.sortMembers();
    pageNumber -= 1;
    if (usePagination) {
      return this.filteredMembers.slice(pageNumber * this.pageSize, (pageNumber + 1) * this.pageSize);
    } else {
      return this.filteredMembers;
    }
  }

  isExcludedMemberLoading(address: string) {
    return this.excludedMembersLoading.includes(address);
  }
}
