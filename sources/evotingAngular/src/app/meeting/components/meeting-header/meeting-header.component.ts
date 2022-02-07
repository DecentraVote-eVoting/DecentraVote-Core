/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CreateMeetingModalComponent} from '../create-meeting-modal/create-meeting-modal.component';
import {ModalService} from '@core/services/modal.service';
import {PermissionService} from '@core/services/permission.service';
import {Permission} from '@core/models/permission.model';
import {ROUTE_PATHS} from '@app/route-paths';
import {MeetingDetailModel, MeetingStage, MeetingTab} from '@meeting/models/meeting.model';
import {User} from '@app/user/models/user.model';
import {Role} from '@user/models/role.model';
import {DeleteMeetingModalComponent} from '@meeting/components/delete-meeting-modal/delete-meeting-modal.component';

@Component({
  selector: 'app-meeting-header',
  templateUrl: './meeting-header.component.html'
})
export class MeetingHeaderComponent {

  @Input() activeTab: MeetingTab;
  @Input() meeting: MeetingDetailModel;
  @Input() chairperson: User;
  @Input() userRole: Role;
  @Input() isMeetingStateChanged: boolean;
  @Input() isMeetingRegistrationStateChanged: boolean;
  @Input() isParticipantRegisteringStateChanged: boolean;
  @Input() showToggleVisibilitySpinner: boolean;
  @Input() showOpenMeetingSpinner: boolean;
  @Input() meetingCanBeClosed: boolean;

  @Output() tabChangeAction = new EventEmitter<MeetingTab>();
  @Output() toggleMeetingVisibility = new EventEmitter();
  @Output() openRegistrationAction = new EventEmitter();
  @Output() closeRegistrationAction = new EventEmitter();
  @Output() openMeetingAction = new EventEmitter();
  @Output() closeMeetingAction = new EventEmitter();
  @Output() joinMeetingAction = new EventEmitter();
  @Output() summarizeMeetingAction = new EventEmitter();

  meetingTab = MeetingTab;
  routePaths = ROUTE_PATHS;
  meetingStage = MeetingStage;

  constructor(private modalService: ModalService,
              private permissionService: PermissionService) {
  }

  openUpdateMeetingModal() {
    this.modalService.openModal<CreateMeetingModalComponent>(CreateMeetingModalComponent, {
      close: true,
      prefillData: this.meeting
    });
  }

  openRemoveMeetingModal() {
    this.modalService.openModal<DeleteMeetingModalComponent>(DeleteMeetingModalComponent, {
      meetingModel: this.meeting,
      close: true
    });
  }

  showMeetingMenu(): boolean {
    return this.permissionService.check(Permission.MEETING_SHOW_MENU, this.meeting);
  }

  showMeetingEdit(): boolean {
    return this.permissionService.check(Permission.MEETING_EDIT, this.meeting);
  }

  showMeetingDelete(): boolean {
    return this.permissionService.check(Permission.MEETING_DELETE, this.meeting);
  }

  userIsAllowedToToggleVisibility(): boolean {
    return this.permissionService.check(Permission.TOGGLE_MEETING_VISIBILITY, this.meeting);
  }

  showMeetingRegistrationOpen(): boolean {
    return this.permissionService.check(Permission.MEETING_REGISTRATION_OPEN, this.meeting);
  }

  showMeetingRegistrationClose(): boolean {
    return this.permissionService.check(Permission.MEETING_REGISTRATION_CLOSE, this.meeting);
  }

  showMeetingOpen(): boolean {
    return this.permissionService.check(Permission.MEETING_OPEN, this.meeting);
  }

  showMeetingClose(): boolean {
    return this.permissionService.check(Permission.MEETING_CLOSE, this.meeting);
  }

  showMeetingSummarize(): boolean {
    return this.permissionService.check(Permission.MEETING_SUMMARIZE, this.meeting);
  }

  showMeetingAuthoritiesTab(): boolean {
    return this.permissionService.check(Permission.MEETING_AUTHORITIES_TAB, this.meeting);
  }

  getParticipantRegistrationState(): boolean {
    return this.isParticipantRegisteringStateChanged || this.isMeetingRegistrationStateChanged;
  }

  showMeetingJoin(): boolean {
    if (!this.userRole) { return false; }   // GUARD
    return this.meeting.registrationOpen
      && this.meeting.promisedToVote !== true
      && this.meeting.hasGivenAuthority !== true
      && this.userRole.isRole(Role.MEMBER);
  }

  showRegisterInfo(): boolean {
    if (!this.userRole) { return false; }   // GUARD
    return this.meeting.registrationOpen
      && this.meeting.promisedToVote !== true
      && this.meeting.hasGivenAuthority !== true
      && this.userRole.isRole(Role.MEMBER);
  }

  showAuthorityInfo(): boolean {
    if (!this.userRole) { return false; }   // GUARD
    return this.meeting.registrationOpen
      && this.meeting.hasGivenAuthority === true
      && this.userRole.isRole(Role.MEMBER);
  }

  showCloseMeetingInfo(): boolean {
    return !this.meetingCanBeClosed && this.showMeetingClose();
  }

  showVisibilityInfo() {
    return !this.meeting.isVisible && !this.userIsAllowedToToggleVisibility();
  }

  showVisibilityInfoDirector() {
    return !this.meeting.isVisible && this.userIsAllowedToToggleVisibility();
  }
}
