/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MeetingFacade} from '@meeting/services/meeting.facade';
import {MeetingDetailModel, MeetingTab} from '@meeting/models/meeting.model';
import {Observable} from 'rxjs/Observable';
import {User} from '@app/user/models/user.model';
import {VoteFacade} from '@voting/services/vote.facade';
import {ModalService} from '@core/services/modal.service';
import {ConfirmationDialogModalComponent} from '@core/components/confirmation-dialog-modal/confirmation-dialog-modal.component';
import {Role} from '@user/models/role.model';

@Component({
  selector: 'app-meeting-header-smart',
  template: `
    <app-meeting-header [meeting]="meeting"
                        [chairperson]="chairperson"
                        [userRole]="userRole"
                        [activeTab]="activeTab"
                        [isMeetingStateChanged]="isMeetingStateChanged$ | async"
                        [isMeetingRegistrationStateChanged]="isMeetingRegistrationStateChanged$ | async"
                        [isParticipantRegisteringStateChanged]="isParticipantRegisteringStateChanged$ | async"
                        [showToggleVisibilitySpinner]="showToggleVisibilitySpinner$ | async"
                        [showOpenMeetingSpinner]="showOpenMeetingSpinner$ | async"
                        [meetingCanBeClosed]="meetingCanBeClosed$ | async"
                        (tabChangeAction)="tabChangeAction.emit($event)"
                        (openRegistrationAction)="onOpenRegistration()"
                        (toggleMeetingVisibility)="onToggleMeetingVisibility()"
                        (closeRegistrationAction)="onCloseRegistration()"
                        (openMeetingAction)="onOpenMeeting()"
                        (closeMeetingAction)="onCloseMeeting()"
                        (joinMeetingAction)="onJoinMeeting()"
                        (summarizeMeetingAction)="onSummarizeMeeting()">
    </app-meeting-header>`
})
export class MeetingHeaderSmartComponent implements OnInit {

  @Input() activeTab: MeetingTab;
  @Input() meeting: MeetingDetailModel;
  @Input() chairperson: User;
  @Input() userRole: Role;

  @Output() tabChangeAction = new EventEmitter<MeetingTab>();

  isMeetingStateChanged$: Observable<boolean>;
  isMeetingRegistrationStateChanged$: Observable<boolean>;
  isParticipantRegisteringStateChanged$: Observable<boolean>;
  showToggleVisibilitySpinner$: Observable<boolean>;
  showOpenMeetingSpinner$: Observable<boolean>;
  meetingCanBeClosed$: Observable<boolean>;

  constructor(private meetingFacade: MeetingFacade,
              private voteFacade: VoteFacade,
              private modalService: ModalService) {
  }

  ngOnInit() {
    this.isMeetingStateChanged$ = this.meetingFacade.getMeetingStateChanged(this.meeting.address);

    this.isMeetingRegistrationStateChanged$ = this.meetingFacade.getMeetingRegistrationStateChanged(this.meeting.address);

    this.isParticipantRegisteringStateChanged$ = this.meetingFacade.getParticipantRegistrationStateChanged(this.meeting.address);

    this.showToggleVisibilitySpinner$ = this.meetingFacade.getToggleVisibilitySpinnerState(this.meeting.address);

    this.showOpenMeetingSpinner$ = this.meetingFacade.getOpenMeetingSpinnerState(this.meeting.address);

    this.meetingCanBeClosed$ = this.voteFacade.allVotesAreArchivedOrCounted(this.meeting.address);
  }

  onToggleMeetingVisibility() {
    this.meetingFacade.toggleMeetingVisibility(this.meeting);
  }

  onOpenRegistration() {
    this.modalService.openModal<ConfirmationDialogModalComponent>(ConfirmationDialogModalComponent, {
      modalCallback: (confirmed: boolean) => {
        if (confirmed) {
          this.meetingFacade.openRegistration(this.meeting);
        }
      },
      headerText: 'Confirmation-Modal.Registration.Open.Header',
      dialogText: 'Confirmation-Modal.Registration.Open.Info',
      consequenceTexts: [
        'Confirmation-Modal.Registration.Open.Consequences.Registration-Delete',
      ],
      close: true
    });
  }

  onCloseRegistration() {
    this.meetingFacade.closeRegisterStage(this.meeting);
  }

  onOpenMeeting() {
    this.modalService.openModal<ConfirmationDialogModalComponent>(ConfirmationDialogModalComponent, {
      modalCallback: (confirmed: boolean) => {
        if (confirmed) {
          this.meetingFacade.openMeeting(this.meeting);
        }
      },
      headerText: 'Confirmation-Modal.Meeting.Open.Header',
      dialogText: 'Confirmation-Modal.Meeting.Open.Info',
      consequenceTexts: [
        'Confirmation-Modal.Meeting.Open.Consequences.Edit-Chairperson',
        'Confirmation-Modal.Meeting.Open.Consequences.Assign-Representatives',
        'Confirmation-Modal.Meeting.Open.Consequences.Delete-Meeting'
      ],
      close: true
    });
  }

  onCloseMeeting() {
    this.meetingFacade.closeMeeting(this.meeting);
  }

  onJoinMeeting() {
    this.meetingFacade.joinMeeting(this.meeting);
  }

  onSummarizeMeeting() {
    window.open(`./#/meeting/summary/${this.meeting.address}`,
      '_blank',
      `height=${screen.height / 1.2},width=${screen.width / 2}`);
  }

}
