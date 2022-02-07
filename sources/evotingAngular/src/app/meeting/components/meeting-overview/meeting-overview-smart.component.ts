/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {MembershipService} from '@core/services/membership.service';
import {first, switchMap, takeUntil} from 'rxjs/operators';
import {MeetingModel} from '@meeting/models/meeting.model';
import {MeetingFacade} from '@meeting/services/meeting.facade';
import {Store} from '@ngrx/store';
import * as meetingActions from '@meeting/+state/meeting.actions';
import {EthersService} from '@core/services/ethers.service';
import {UserFacade} from '@app/user/services/user.facade';
import {User} from '@user/models/user.model';


@Component({
  selector: 'app-meeting-overview-smart',
  template: `
    <app-meeting-overview [meetings]="meetings"
                          [isMeetingsLoading]="isMeetingsLoading"
                          [userIsDirector]="userIsDirector$ | async"
                          [user]="user">
    </app-meeting-overview>`
})
export class MeetingOverviewSmartComponent implements OnInit, OnDestroy {

  userIsDirector$: Observable<boolean>;
  meetings: MeetingModel[] = [];
  isMeetingsLoading: boolean;
  user: User;

  private unsubscribe$ = new Subject();

  constructor(private meetingFacade: MeetingFacade,
              private membershipService: MembershipService,
              private cdr: ChangeDetectorRef,
              private store: Store<any>,
              private ethersService: EthersService,
              private userFacade: UserFacade) {
    this.userIsDirector$ = this.membershipService.userIsDirector;
  }

  ngOnInit() {
    this.ethersService.getSignerAddress()
      .pipe(first(),
        switchMap((address: string) => {
          return this.userFacade.getUserByAddress(address);
        }))
      .subscribe(user => this.user = user);

    this.meetingFacade.getMeetings()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(meetings => {
        if (meetings.length <= 1) {
          this.store.dispatch(meetingActions.GetMeetingAddressesAction());
        }
        this.meetings = meetings;
        this.cdr.detectChanges();
      });

    this.meetingFacade.getMeetingsLoading()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(meetingsLoading => {
        this.isMeetingsLoading = meetingsLoading;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
