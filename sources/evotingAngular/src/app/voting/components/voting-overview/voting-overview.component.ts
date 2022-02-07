/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from '@angular/core';
import {CreateVotingModalComponent} from '../create-voting-modal/create-voting-modal.component';
import {ModalService} from '@core/services/modal.service';
import {Permission} from '@core/models/permission.model';
import {PermissionService} from '@core/services/permission.service';
import {AssetFiles} from '@core/models/asset.model';
import {VoteStage} from '@voting/models/vote-stage.enum';
import {MeetingDetailModel, MeetingStage} from '@meeting/models/meeting.model';
import Sortable from 'sortablejs';
import {SaveSortingModalComponent} from '@voting/components/save-sorting-modal/save-sorting-modal.component';
import {User} from '@app/user/models/user.model';

@Component({
  selector: 'app-voting-overview',
  templateUrl: './voting-overview.component.html'
})
export class VotingOverviewComponent implements OnChanges {

  @Input() meeting: MeetingDetailModel;
  @Input() chairperson: User;
  @Input() voteAddresses: string[] = [];
  @Input() voteLoading: boolean;
  @Input() userIsDirector = false;
  @Input() userIsChairperson = false;

  meetingStage = MeetingStage;
  votingStage = VoteStage;
  assetFiles = AssetFiles;

  @ViewChild('cardGridElement') gridElementRef: ElementRef;
  @Output() finishedSortingEvent = new EventEmitter<string[]>();
  sortableGrid: Sortable;
  isWiggleAnimationActive = false;
  gridOptions = {
    animation: 120,
    disabled: true,
    swapThreshold: 0.50,
    ghostClass: 'sortable-ghost',
    dataIdAttr: 'id'
  };

  constructor(private modalService: ModalService,
              private permissionService: PermissionService) {
  }

  // Grid nach änderungen automatisch sortieren, um
  ngOnChanges(_: SimpleChanges) {
    if (this.sortableGrid) {
      // @ts-ignore , definition is outdated, second argument should be fine
      this.sortableGrid.sort(this.voteAddresses, true);
    }
  }

  openCreateVoteModal() {
    this.modalService.openModal<CreateVotingModalComponent>(CreateVotingModalComponent, {
      close: true,
      prefillData: {
        address: '',
        meetingAddress: this.meeting.address,
        description: '',
        title: '',
        isAnonymous: false
      }
    });
  }

  showCreateVoting(): boolean {
    return this.permissionService.check(Permission.VOTING_CREATE, this.meeting);
  }

  showSortVoting(): boolean {
    return this.permissionService.check(Permission.VOTING_SORT, this.meeting);
  }

  toggleSortingMode() {
    if (this.sortableGrid === undefined) {
      // initialize & cache sortable object the first time to be able to change options in future
      this.sortableGrid = new Sortable(this.gridElementRef.nativeElement, this.gridOptions);
    }
    this.sortableGrid.options.disabled ? this.enableSortingMode() : this.openSaveSortingModal();
  }

  enableSortingMode() {
    this.playWiggleAnimation();
    this.sortableGrid.options.disabled = false;
  }

  openSaveSortingModal() {
    this.modalService.openModal<SaveSortingModalComponent>(SaveSortingModalComponent, {
      modalCallback: (saveSorting: boolean) => { saveSorting ? this.saveSorting() : this.discardSorting(); },
      close: true
    });
  }

  saveSorting() {
    // only send sorted vote addresses to contracts if something has changed
    const sortedVoteAddresses = this.sortableGrid.toArray();
    if (JSON.stringify(this.voteAddresses) !== JSON.stringify(sortedVoteAddresses)) {
      this.voteAddresses = this.sortableGrid.toArray();
      this.finishedSortingEvent.emit(this.voteAddresses);
    }

    this.sortableGrid.options.disabled = true;
  }

  discardSorting() {
    // @ts-ignore , definition is outdated, second argument should be fine
    this.sortableGrid.sort(this.voteAddresses, true);

    this.sortableGrid.options.disabled = true;
  }

  playWiggleAnimation() {
    // you must not apply the css class that is responsible for the wiggle animation all the time
    // it needs to be removed, because it blocks the card-switching-animation of SortableJS Framework
    this.isWiggleAnimationActive = true;
    setTimeout(() => this.isWiggleAnimationActive = false, 500);
  }

  isSortingModeActive(): boolean {
    return this.sortableGrid && !this.sortableGrid.options.disabled;
  }
}
