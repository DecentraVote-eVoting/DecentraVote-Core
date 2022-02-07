/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {MeetingFacade} from '@meeting/services/meeting.facade';
import {MemberRepresentation, MemberWithPotentialVotingCount} from '@meeting/models/meeting-member.model';
import {MeetingModel} from '@app/meeting/models/meeting.model';
import {takeUntil} from 'rxjs/operators';
import {User} from '@app/user/models/user.model';
import {Observable} from 'rxjs/Observable';
import {MembershipService} from '@core/services/membership.service';

@Component({
  selector: 'app-authorities-smart-list',
  template: `
    <app-authorities-list [meeting]="meeting"
                          [representations]="representations"
                          [organizationMembers]="organizationMembers"
                          [userIsDirector]="userIsDirector$ | async"
                          (removeAuthorityAction)="onRemoveRepresentation($event)">
    </app-authorities-list>`
})
export class AuthoritiesListSmartComponent implements OnInit, OnDestroy {

  @Input() meeting: MeetingModel;

  @Input() representations: MemberRepresentation[];
  @Input() organizationMembers: MemberWithPotentialVotingCount[];

  private unsubscribe$ = new Subject();

  userIsDirector$: Observable<boolean>;

  constructor(private meetingFacade: MeetingFacade,
              private membershipService: MembershipService) {
    this.userIsDirector$ = this.membershipService.userIsDirector;
  }

  ngOnInit() {
    this.meetingFacade.getMemberRepresentations(this.meeting.address)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(representations => {
        this.representations = representations;
      });

    this.meetingFacade.getAllMembersWithPotentialVotingCount(this.meeting.address)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(organizationMembers => {
        this.organizationMembers = organizationMembers;
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onRemoveRepresentation(representee: User) {
    this.meetingFacade.removeRepresentation(this.meeting, representee);
  }

}
