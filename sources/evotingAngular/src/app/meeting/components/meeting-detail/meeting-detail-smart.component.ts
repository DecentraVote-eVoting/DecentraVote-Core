/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {MembershipService} from '@core/services/membership.service';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';
import {MeetingFacade} from '@meeting/services/meeting.facade';
import {MeetingDetailModel} from '@meeting/models/meeting.model';
import * as meetingActions from '@meeting/+state/meeting.actions';
import {Store} from '@ngrx/store';
import * as fromRoot from '@app/app.store';

@Component({
  selector: 'app-meeting-smart',
  template: `
    <app-meeting [meeting]="meeting"
                 [userIsDirector]="userIsDirector$ | async"
    >
    </app-meeting>`
})
export class MeetingDetailSmartComponent implements OnInit, OnDestroy {

  meeting: MeetingDetailModel;
  memberAddress: string;
  userIsDirector$: Observable<boolean>;

  private unsubscribe$ = new Subject();

  constructor(private meetingFacade: MeetingFacade,
              private route: ActivatedRoute,
              private membershipService: MembershipService,
              private cdr: ChangeDetectorRef,
              private store: Store<fromRoot.State>,
  ) {
    this.userIsDirector$ = this.membershipService.userIsDirector;
  }

  ngOnInit() {

    const meetingAddress = this.route.snapshot.params.meetingAddress;
    this.store.dispatch(meetingActions.GetMeetingDetailAction({address: meetingAddress}));

    this.meetingFacade.getMeetingDetailModel(meetingAddress)
      .pipe(takeUntil(this.unsubscribe$),
        distinctUntilChanged())
      .subscribe(meeting => {
        this.meeting = meeting;

        this.cdr.detectChanges();
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
