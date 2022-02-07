/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ModalService} from '@core/services/modal.service';
import {CreateAuthorityModalComponent} from '../create-authority-modal/create-authority-modal.component';
import {PermissionService} from '@core/services/permission.service';
import {Permission} from '@core/models/permission.model';
import {AssetFiles} from '@core/models/asset.model';
import {MemberRepresentation, MemberWithPotentialVotingCount} from '@meeting/models/meeting-member.model';
import {MeetingModel, MeetingStage} from '@meeting/models/meeting.model';
import {User} from '@app/user/models/user.model';
import {MemberNamePipe} from '@core/pipes/member-name.pipe';
import {MembershipService} from '@core/services/membership.service';

@Component({
  selector: 'app-authorities-list',
  templateUrl: './authorities-list.component.html'
})

// TODO: Rename to 'MeetingAuthoritiesComponent' because this component is NOT a list
export class AuthoritiesListComponent {

  @Input() meeting: MeetingModel;
  @Input() organizationMembers: MemberWithPotentialVotingCount[] = [];

  @Input()
  set representations(representations: MemberRepresentation[]) {
    this._representations = representations;
    this.searchRepresentation();
  }

  get representations() {
    return this._representations;
  }

  @Input() userIsDirector: boolean;

  @Output() removeAuthorityAction = new EventEmitter<User>();

  assetFiles = AssetFiles;
  representationsFiltered: MemberRepresentation[] = [];

  constructor(private modalService: ModalService,
              private permissionService: PermissionService,
              private memberNamePipe: MemberNamePipe,
              private membershipService: MembershipService) {
  }

  private _representations: MemberRepresentation[];

  // Opens create-authority-modal when associated button is clicked
  // authority dictates that you can't give away your voting right once you have gotten one
  openCreateRepresentationsModal() {
    const representees = this.representations.map(representation => representation.representee.address);
    const inputs = {
      close: true,
      representativeList: this.organizationMembers.filter(member => {
        return member.potentialVotingCount < 2 && !representees.includes(member.address);
      }),
      representeeList: this.organizationMembers.filter(member => !representees.includes(member.address)),
      meeting: this.meeting,
    };

    this.modalService.openModal<CreateAuthorityModalComponent>(CreateAuthorityModalComponent, inputs);
  }

  searchRepresentation(searchText: string = '') {
    if (!searchText) {
      this.representationsFiltered = this.representations;
    } else {
      this.representationsFiltered = this.representations.filter(representation => {
        const representeeFullName = this.memberNamePipe.transform(representation.representee);
        const representativeFullName = this.memberNamePipe.transform(representation.representative);
        const representationNames = `${representeeFullName} ${representativeFullName}`;

        return representationNames.toLowerCase().includes(searchText.toLowerCase());
      });
    }
  }

  disableCreateAuthorityButton(): boolean {
    return this.userIsDirector && this.meeting.stage !== MeetingStage.CREATED;
  }

  showRemoveAuthority(): boolean {
    return this.permissionService.check(Permission.MEETING_REMOVE_AUTHORITY, this.meeting);
  }
}
