/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable, OnDestroy} from '@angular/core';
import {MeetingDetailModel, MeetingModel, MeetingStage} from '@meeting/models/meeting.model';
import {MembershipService} from './membership.service';
import {Permission, PermissionCheck} from '../models/permission.model';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {VotePermissionModel} from '@voting/models/vote.model';
import {VoteStage} from '@voting/models/vote-stage.enum';

@Injectable({providedIn: 'root'})
export class PermissionService implements OnDestroy {

  private userIsDirector = false;
  private userIsGuest = false;
  private userIsMember = false;
  private unsubscribe$ = new Subject();

  constructor(private membershipService: MembershipService) {
    this.membershipService.userIsDirector
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(isDirector => this.userIsDirector = isDirector);
    this.membershipService.userIsGuest
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(isGuest => this.userIsGuest = isGuest);
    this.membershipService.userIsMember
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(isMember => this.userIsMember = isMember);
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  check(permission: Permission, meeting?: MeetingModel, vote?: VotePermissionModel): boolean {
    return this.checkPermission({permission, meeting, vote} as PermissionCheck);
  }

  checkMeetings(permission: Permission, meetings: MeetingModel[]) {
    return this.checkPermission({permission, meetings} as PermissionCheck);
  }

  checkMeetingDetailModel(permission: Permission, meetingDetailModel: MeetingDetailModel) {
    return this.checkPermission({permission, meetingDetailModel} as PermissionCheck);
  }

  private checkPermission(p: PermissionCheck): boolean {
    let userIsChairperson = false;
    if (p.meeting) {
      userIsChairperson = this.membershipService.isChairperson(p.meeting);
    }
    switch (p.permission) {
      case Permission.VOTING_EDIT:
        return ((this.userIsDirector && p.meeting.stage < MeetingStage.OPEN) || userIsChairperson
          && p.meeting.stage === MeetingStage.OPEN)
          && p.vote.stage === VoteStage.CREATED;

      case Permission.VOTING_PROCESS_OPTIONS:
        return ((this.userIsDirector && p.meeting.stage < MeetingStage.OPEN) || userIsChairperson
          && p.meeting.stage === MeetingStage.OPEN)
          && p.vote.stage !== VoteStage.ARCHIVED && p.vote.stage !== VoteStage.COUNTED;

      case Permission.VOTING_OPEN:
        return p.vote.stage === VoteStage.CREATED && p.meeting.stage === MeetingStage.OPEN;

      case Permission.VOTING_ARCHIVE:
        return p.vote.stage === VoteStage.CREATED;

      case Permission.VOTING_CLOSE:
        return p.vote.stage === VoteStage.OPENED;

      case Permission.VOTING_FINISH:
        return p.vote.stage === VoteStage.CLOSED;

      case Permission.VOTING_DELETE:
        return ((this.userIsDirector && p.meeting.stage < MeetingStage.OPEN)
            || (userIsChairperson && p.meeting.stage === MeetingStage.OPEN))
          && p.vote.stage === VoteStage.CREATED;

      case Permission.VOTING_CREATE:
        return this.userIsDirector && p.meeting.stage === MeetingStage.CREATED ||
          (userIsChairperson && p.meeting.stage === MeetingStage.OPEN);

      case Permission.VOTING_SORT:
        return this.userIsDirector && p.meeting.stage === MeetingStage.CREATED ||
          (userIsChairperson && p.meeting.stage === MeetingStage.OPEN);

      case Permission.VOTING_SHOW_VOTE_COUNT:
        return userIsChairperson && (p.vote.stage >= VoteStage.OPENED && p.vote.stage <= VoteStage.COUNTED);

      case Permission.VOTING_SHOW_ICON:
        return p.vote.stage >= VoteStage.OPENED && p.vote.stage < VoteStage.ARCHIVED;

      case Permission.VOTING_CHANGE_ALLOWED:
        return ((this.userIsDirector && p.meeting.stage < MeetingStage.OPEN)
          || (userIsChairperson && p.meeting.stage >= MeetingStage.OPEN))
          && p.vote.stage === VoteStage.CREATED;

      case Permission.VOTING_CERTIFICATE:
        return p.vote.stage >= VoteStage.OPENED && p.vote.stage < VoteStage.ARCHIVED;

      case Permission.MEETING_CREATE_AUTHORITY:
      case Permission.MEETING_REMOVE_AUTHORITY:
        return this.userIsDirector && p.meeting.stage === MeetingStage.CREATED;

      case Permission.MEETING_JOIN:
        return this.userIsMember && p.meeting.registrationOpen;

      case Permission.MEETING_JOIN_BUTTON:
        return this.userIsMember
          && p.meetingDetailModel.registrationOpen
          && !p.meetingDetailModel.promisedToVote
          && !p.meetingDetailModel.hasGivenAuthority;

      case Permission.MEETING_USER_PROMISED_TO_VOTE:
        return this.userIsMember
          && p.meetingDetailModel.promisedToVote
          && !p.meetingDetailModel.hasGivenAuthority;
      case Permission.MEETING_DELETE:
        return this.userIsDirector &&
          p.meeting.stage === MeetingStage.CREATED &&
          !p.meeting.registrationOpen &&
          p.meeting.registeredVoters.length === 0;

      case Permission.MEETING_SHOW_MENU:
        return (userIsChairperson && (p.meeting.stage !== MeetingStage.CLOSED))
          || (this.userIsDirector && (p.meeting.stage !== MeetingStage.OPEN));

      case Permission.SHOW_MEETING:
        return p.meeting.isVisible || this.userIsDirector || userIsChairperson;

      case Permission.MEETING_EDIT:
        return this.userIsDirector && p.meeting.stage === MeetingStage.CREATED;

      case Permission.MEETING_PUBLISH:
        return this.userIsDirector && p.meeting.stage === MeetingStage.CREATED;

      case Permission.MEETING_OPEN:
        return userIsChairperson && p.meeting.stage === MeetingStage.CREATED;

      case Permission.MEETING_CLOSE:
        return userIsChairperson && p.meeting.stage === MeetingStage.OPEN;

      case Permission.MEETING_REGISTRATION_OPEN:
        return !p.meeting.registrationOpen && p.meeting.stage !== MeetingStage.CLOSED &&
          ((p.meeting.stage <= MeetingStage.CREATED && this.userIsDirector) ||
            p.meeting.stage === MeetingStage.OPEN && userIsChairperson);

      case Permission.MEETING_REGISTRATION_CLOSE:
        return p.meeting.registrationOpen && p.meeting.stage !== MeetingStage.CLOSED &&
          ((p.meeting.stage <= MeetingStage.CREATED && this.userIsDirector) ||
            p.meeting.stage === MeetingStage.OPEN && userIsChairperson);

      case Permission.MEETING_SUMMARIZE:
        return p.meeting.stage === MeetingStage.CLOSED;

      case Permission.MEETING_AUTHORITIES_TAB:
        return this.userIsDirector || userIsChairperson;

      case Permission.MEETING_CREATE:
      case Permission.MEMBER_REMOVE_IMPORT:
      case Permission.MEMBER_PROMOTE:
      case Permission.MEMBER_DEMOTE:
      case Permission.USER_IMPORT:
      case Permission.USER_EXPORT:
      case Permission.USER_MANAGE:
        return this.userIsDirector;

      case Permission.MEMBER_REMOVE:
        return this.userIsDirector
          && !p.meetings.find(m => m.stage > MeetingStage.CREATED && m.stage < MeetingStage.CLOSED);

      case Permission.TOGGLE_MEETING_VISIBILITY:
        return this.userIsDirector && (p.meeting.stage !== MeetingStage.OPEN);

      case Permission.USER_IS_GUEST:
        return this.userIsGuest;
      case Permission.USER_IS_MEMBER:
        return this.userIsMember;
      case Permission.USER_IS_DIRECTOR:
        return this.userIsDirector;
      default:
        return false;
    }
  }
}
