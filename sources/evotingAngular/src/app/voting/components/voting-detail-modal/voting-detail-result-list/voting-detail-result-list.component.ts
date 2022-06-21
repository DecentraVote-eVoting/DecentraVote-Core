/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ChangeDetectorRef, Component, EventEmitter, HostListener, Input, Output, ViewChild} from '@angular/core';
import {UserResult, VoteDetailModel, VoteResultSorting} from '@voting/models/vote.model';
import {MatAccordion} from '@angular/material/expansion';

@Component({
  selector: 'app-voting-detail-result-list',
  templateUrl: './voting-detail-result-list.component.html'
})
export class VotingDetailResultListComponent {

  @Input() vote: VoteDetailModel;
  @Input() disableButton: boolean;
  @Input() showButton: boolean;
  @Input() resultsByOption: { [key: string]: { results: UserResult[], expanded: boolean } } = {};


  @Input()
  set resultsByUser(resultsByMember: { [key: string]: { result: UserResult, expanded: boolean } }) {
    this._resultsByUser = resultsByMember;
    this.resultsByUserFiltered = resultsByMember;
  }

  get resultsByUser(): { [key: string]: { result: UserResult, expanded: boolean } } {
    return this._resultsByUser;
  }

  get resultsByMemberCount(): number {
    return Object.keys(this._resultsByUser).length;
  }

  @Output() exportButtonClick = new EventEmitter();

  @ViewChild(MatAccordion) accordion: MatAccordion;

  expandCollapseButtonState = false;
  expandedCount = 0;

  voteResultSorting = VoteResultSorting;
  selectedView: VoteResultSorting = VoteResultSorting.BY_OPTIONS;

  _resultsByUser: { [key: string]: { result: UserResult, expanded: boolean } } = {};
  resultsByUserFiltered: { [key: string]: { result: UserResult, expanded: boolean } } = {};
  paginationArray: { [key: string]: { result: UserResult, expanded: boolean } }[];
  pageSize = 10;
  page = 1;
  screenWidth: number;
  dictLength: number;

  constructor(private cdr: ChangeDetectorRef) {
    this.onResize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?) {
    this.screenWidth = window.innerWidth;
  }

  toggleAll() {
    this.expandCollapseButtonState = !this.expandCollapseButtonState;

    if (this.expandCollapseButtonState) {
      this.accordion.openAll();
      this.setExpandStateOfAll(true);
    } else {
      this.accordion.closeAll();
      this.setExpandStateOfAll(false);
    }
  }

  toggleOne(key: string) {
    const data = this.selectedView === 1 ? this.resultsByOption : this.resultsByUserFiltered;
    data[key].expanded = !data[key].expanded;
    this.expandedCount += data[key].expanded ? 1 : -1;

    this.expandCollapseButtonState = this.expandedCount >= Object.keys(data).length / 2;
  }

  onSelectedViewChange(val: VoteResultSorting) {
    this.selectedView = val;
    this.expandCollapseButtonState = false;
    this.setExpandStateOfAll(false);
    this.resultsByUserFiltered = this.resultsByUser;
    this.cdr.detectChanges();
  }

  setExpandStateOfAll(val: boolean) {
    const data = this.selectedView === 1 ? this.resultsByOption : this.resultsByUserFiltered;
    Object.keys(data).forEach(key => data[key].expanded = val);
    this.expandedCount = Object.keys(data).filter(key => data[key].expanded).length;
  }

  resetStateToCollapsed() {
    this.expandCollapseButtonState = false;
    this.setExpandStateOfAll(false);
  }

  search(searchString: string = '') {
    if (searchString) {
      this.page = 1;
      const filteredNew = Object.assign({}, ...Object.entries(this.resultsByUser)
        .filter(([_, value]) => `${value.result.name1} ${value.result.name2}`
          .toLowerCase()
          .includes(searchString.toLowerCase()))
        .map(([k, v]) => ({[k]: v}))
      );

      if (JSON.stringify(this.resultsByUserFiltered) !== JSON.stringify(filteredNew)) {
        this.resultsByUserFiltered = filteredNew;
        this.resetStateToCollapsed();
      }

    } else {
      if (JSON.stringify(this.resultsByUserFiltered) !== JSON.stringify(this.resultsByUser)) {
        this.resultsByUserFiltered = this.resultsByUser;
        this.resetStateToCollapsed();
      }
    }
  }

  getDictionary(pageNumber: number, usePagination: boolean): any {
    this.dictLength = Object.keys(this.resultsByUserFiltered).length;
    pageNumber -= 1;
    if (usePagination) {
      return Object.values(this.resultsByUserFiltered).slice(pageNumber * this.pageSize, (pageNumber + 1) * this.pageSize);
    } else {
      return Object.values(this.resultsByUserFiltered);
    }
  }

  onPageClick() {
    this.resetStateToCollapsed();
    this.accordion.closeAll();
  }

}
