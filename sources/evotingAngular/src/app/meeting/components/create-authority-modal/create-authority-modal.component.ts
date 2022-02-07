/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component} from '@angular/core';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {MemberWithPotentialVotingCount} from '@meeting/models/meeting-member.model';
import {MeetingModel} from '@meeting/models/meeting.model';
import {MeetingFacade} from '@meeting/services/meeting.facade';
import {PlatformLocation} from '@angular/common';

@Component({
  selector: 'app-create-authority-modal',
  templateUrl: './create-authority-modal.component.html'
})
export class CreateAuthorityModalComponent extends AbstractModalComponent {

  meeting: MeetingModel;
  representative: MemberWithPotentialVotingCount;
  representativeList: MemberWithPotentialVotingCount[];
  representee: MemberWithPotentialVotingCount;
  representeeList: MemberWithPotentialVotingCount[];

  constructor(protected modalRef: NgbActiveModal,
              private platform: PlatformLocation,
              private meetingFacade: MeetingFacade) {
    super(modalRef, platform);
  }

  showButtonDisabled() {
    return (!this.representative || !this.representee) || this.representative.address === this.representee.address;
  }

  addAuthority() {
    this.meetingFacade.createRepresentation(this.meeting, this.representee.address, this.representative.address);
    this.modalRef.close();
  }
}
