/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {MeetingDetailModel, MeetingModel} from '@meeting/models/meeting.model';
import {ActivatedRoute, Router} from '@angular/router';
import {MeetingFacade} from '@meeting/services/meeting.facade';
import {MembershipService} from '@core/services/membership.service';
import {ROUTE_PATHS} from '@app/route-paths';
import {distinctUntilChanged, map, takeUntil} from 'rxjs/operators';
import {UserFacade} from '@app/user/services/user.facade';
import {User} from '@app/user/models/user.model';
import {ModalService} from '@core/services/modal.service';
import {DeleteMeetingModalComponent} from '@meeting/components/delete-meeting-modal/delete-meeting-modal.component';
import {CreateMeetingModalComponent} from '@meeting/components/create-meeting-modal/create-meeting-modal.component';

@Component({
  selector: 'app-meeting-card-smart',
  template: `
    <app-meeting-card [meeting]="meetingDetailModel$ | async"
                      [numberOfVotes]="numberOfVotes"
                      [chairperson]="chairperson$ | async"
                      [isParticipantStateChanged]="isParticipantRegisteringStateChanged"
                      (openMeetingAction)="onOpenMeeting()"
                      (joinMeetingAction)="onJoinMeeting()"
                      (openDeleteModal)="openDeleteModal()"
                      (openEditModal)="openEditModal()"
    >
    </app-meeting-card>`
})
export class MeetingCardSmartComponent implements OnInit, OnDestroy {

  @Input()
  meeting: MeetingModel;

  meetingDetailModel$: Observable<MeetingDetailModel>;
  chairperson$: Observable<User>;

  numberOfVotes = -1;
  isParticipantRegisteringStateChanged = false;

  private unsubscribe$ = new Subject();

  constructor(private router: Router,
              private route: ActivatedRoute,
              private meetingFacade: MeetingFacade,
              private memberFacade: UserFacade,
              private membershipService: MembershipService,
              private cdr: ChangeDetectorRef,
              private modalService: ModalService
  ) {}

  ngOnInit(): void {

    this.chairperson$ = this.memberFacade.getUserByAddress(this.meeting.chairperson);

    this.meetingDetailModel$ = this.meetingFacade.getMeetingDetailModel(this.meeting.address).pipe(
      map((meeting: MeetingDetailModel) => {
        this.numberOfVotes = meeting.votes.length;
        this.cdr.detectChanges();
        return meeting;
      })
    );

    this.meetingFacade.getParticipantRegistrationStateChanged(this.meeting.address)
      .pipe(takeUntil(this.unsubscribe$),
        distinctUntilChanged())
      .subscribe(changedState => {
        this.isParticipantRegisteringStateChanged = changedState || false;
      });
  }

  onOpenMeeting() {
    this.router.navigate([ROUTE_PATHS.MEETING_DETAIL.valueOf(), this.meeting.address])
      .catch(_ => console.warn('Could not navigate to route'));
  }

  onJoinMeeting() {
    this.meetingFacade.joinMeeting(this.meeting);
  }

  openDeleteModal() {
    this.modalService.openModal<DeleteMeetingModalComponent>(DeleteMeetingModalComponent, {
      meetingModel: this.meeting,
      close: true,
    });
  }

  openEditModal() {
    this.modalService.openModal<CreateMeetingModalComponent>(CreateMeetingModalComponent, {
      close: true,
      prefillData: this.meeting
    });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
