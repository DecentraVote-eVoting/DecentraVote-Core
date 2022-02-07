/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {MeetingDetailModel, MeetingStage} from '@meeting/models/meeting.model';
import {User} from '@app/user/models/user.model';
import {PermissionService} from '@core/services/permission.service';
import {Permission} from '@core/models/permission.model';

@Component({
  selector: 'app-meeting-card',
  templateUrl: './meeting-card.component.html'
})
export class MeetingCardComponent {

  @Input() meeting: MeetingDetailModel;
  @Input() numberOfVotes: number;
  @Input() chairperson: User;
  @Input() isParticipantStateChanged: boolean;

  @Output() openMeetingAction = new EventEmitter();
  @Output() joinMeetingAction = new EventEmitter();
  @Output() openDeleteModal = new EventEmitter();
  @Output() openEditModal = new EventEmitter();

  meetingStage = MeetingStage;

  constructor(private permissionService: PermissionService) {
  }

  getParticipantCanJoin(): boolean {
    return this.permissionService.checkMeetingDetailModel(Permission.MEETING_JOIN_BUTTON, this.meeting);
  }

  userPromisedToVote(): boolean {
    return this.permissionService.checkMeetingDetailModel(Permission.MEETING_USER_PROMISED_TO_VOTE, this.meeting);
  }

  showMeetingJoin(): boolean {
    return this.permissionService.check(Permission.MEETING_JOIN, this.meeting);
  }

  showMeetingDelete(): boolean {
    return this.permissionService.check(Permission.MEETING_DELETE, this.meeting);
  }

  showMeetingEdit(): boolean {
    return this.permissionService.check(Permission.MEETING_EDIT, this.meeting);
  }

}
