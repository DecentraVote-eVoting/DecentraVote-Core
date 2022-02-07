/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, Input} from '@angular/core';
import {MeetingModel} from '@meeting/models/meeting.model';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {MeetingFacade} from '@meeting/services/meeting.facade';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {PlatformLocation} from '@angular/common';

@Component({
  selector: 'app-delete-meeting-modal',
  templateUrl: './delete-meeting-modal.component.html',
})
export class DeleteMeetingModalComponent extends AbstractModalComponent {

  @Input() meetingModel: MeetingModel;

  constructor(
    protected modalRef: NgbActiveModal,
    private meetingFacade: MeetingFacade,
    private platform: PlatformLocation
    ) {
    super(modalRef, platform);
  }

  deleteMeeting() {
    this.meetingFacade.deleteMeeting(this.meetingModel);
    this.dismiss();
  }

}
