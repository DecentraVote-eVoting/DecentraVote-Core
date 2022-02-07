/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {User} from '@app/user/models/user.model';
import {takeUntil} from 'rxjs/operators';
import {MeetingModel} from '@meeting/models/meeting.model';
import {Subject} from 'rxjs';
import {MeetingFacade} from '@meeting/services/meeting.facade';
import {ImportUser} from '@import-user/models/import-user.model';
import {ImportUserFacade} from '@import-user/services/import-user.facade';
import {Store} from '@ngrx/store';
import * as fromRoot from '@app/app.store';
import * as meetingActions from '@meeting/+state/meeting.actions';

@Component({
  selector: 'app-user-manage-smart',
  template: `
    <app-user-manage   [users]="userList"
                       [importedUsers]="importedUsers"
                       [authOptions]="authOptions"
                       [userIsDirector]="userIsDirector"
                       [usersLoading]="usersLoading"
                       [meetingsLoading]="meetingsLoading"
                       [meetings]="meetings">
    </app-user-manage>`
})
export class UserManageSmartComponent implements OnInit, OnDestroy {

  @Input() userList: User[];
  @Input() importedUsers: ImportUser[];
  @Input() authOptions: string[];
  @Input() userIsDirector: boolean;
  @Input() usersLoading: boolean;

  meetingsLoading = true;
  meetings: MeetingModel[] = [];

  private unsubscribe$ = new Subject();

  constructor(private meetingFacade: MeetingFacade,
              private importUserFacade: ImportUserFacade,
              private cdr: ChangeDetectorRef,
              private store: Store<fromRoot.State>) {
  }

  ngOnInit() {
    this.importUserFacade.dispatchImportUsers();

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
        this.meetingsLoading = meetingsLoading;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
