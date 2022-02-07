/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {MeetingFacade} from '@meeting/services/meeting.facade';
import {MemberWithVotingCount} from '@meeting/models/meeting-member.model';
import {takeUntil} from 'rxjs/operators';
import {MeetingModel} from '@meeting/models/meeting.model';
import {UserFacade} from '@app/user/services/user.facade';

@Component({
  selector: 'app-participants-smart-list',
  template: `
    <app-participants-list [representees]="authorities"
                           [authoritiesLoading]="authoritiesLoading"
                           [members]="members"
                           [participantsLoading]="membersLoading">
    </app-participants-list>`
})
export class ParticipantsListSmartComponent implements OnInit, OnDestroy {

  @Input() meeting: MeetingModel;
  @Input() authorities: MemberWithVotingCount[];
  authoritiesLoading: boolean;
  @Input() members: MemberWithVotingCount[];
  membersLoading: boolean;

  private unsubscribe$ = new Subject();

  constructor(private meetingFacade: MeetingFacade,
              private memberFacade: UserFacade,
              private cdr: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.memberFacade.getIsUserLoading()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(participantsLoading => {
        this.membersLoading = participantsLoading;
        this.cdr.detectChanges();
      });

    this.meetingFacade.getMembersWithVotingCount(this.meeting.address)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(participantsLoading => {
        this.members = participantsLoading;
      });

    this.meetingFacade.getRepresenteeWithVotingCount(this.meeting.address)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(participantsLoading => {
        this.authorities = participantsLoading;
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
