/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import * as voteActions from '@voting/+state/vote.actions';
import {Subject} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {takeUntil} from 'rxjs/operators';
import {VoteFacade} from '@voting/services/vote.facade';
import {MeetingDetailModel} from '@meeting/models/meeting.model';
import {Store} from '@ngrx/store';
import {MeetingFacade} from '@meeting/services/meeting.facade';
import {User} from '@app/user/models/user.model';

@Component({
  selector: 'app-voting-overview-smart',
  template: `
    <app-voting-overview [meeting]="meeting"
                         [chairperson]="chairperson"
                         [voteAddresses]="voteAddresses"
                         [voteLoading]="voteLoading"
                         [userIsDirector]="userIsDirector"
                         [userIsChairperson]="userIsChairperson"
                         (finishedSortingEvent)="onFinishedSortingEvent($event)">
    </app-voting-overview>`
})
export class VotingOverviewSmartComponent implements OnInit, OnDestroy {

  @Input() meeting: MeetingDetailModel;
  @Input() chairperson: User;
  @Input() userIsDirector = false;
  @Input() userIsChairperson = false;

  voteLoading: boolean;
  voteAddresses: string[] = [];

  private unsubscribe$ = new Subject();

  constructor(private voteFacade: VoteFacade,
              private meetingFacade: MeetingFacade,
              private store: Store<any>,
              private route: ActivatedRoute,
              private cdr: ChangeDetectorRef) {
  }

  ngOnInit() {
    const meetingAddress = this.route.snapshot.params.meetingAddress;

    this.store.dispatch(voteActions.GetVoteAddressesAction({generalMeetingAddress: meetingAddress}));

    this.meetingFacade.getVoteAddresses(meetingAddress)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(addresses => {
        this.voteAddresses = addresses || [];
      });

    this.voteFacade.getVoteLoading()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(voteLoading => {
        this.voteLoading = voteLoading;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onFinishedSortingEvent(voteAddresses: string[]) {
    this.meetingFacade.sortVotesOfMeeting(this.meeting.address, voteAddresses);
  }
}
