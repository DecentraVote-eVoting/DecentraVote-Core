/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {MeetingDetailModel, MeetingModel} from '@meeting/models/meeting.model';
import {VotePermissionModel} from '@voting/models/vote.model';

export interface PermissionCheck {
  permission: Permission;
  meeting?: MeetingModel;
  vote?: VotePermissionModel;
  meetings?: MeetingModel[];
  meetingDetailModel: MeetingDetailModel;
}

export enum Permission {
  VOTING_EDIT,
  VOTING_PROCESS_OPTIONS,
  VOTING_OPEN,
  VOTING_ARCHIVE,
  VOTING_CLOSE,
  VOTING_FINISH,
  VOTING_CREATE,
  VOTING_SHOW_VOTE_COUNT,
  VOTING_SHOW_ICON,
  VOTING_CHANGE_ALLOWED,
  VOTING_SORT,
  VOTING_DELETE,

  MEETING_CREATE,
  MEETING_DELETE,
  MEETING_JOIN,
  MEETING_JOIN_BUTTON,
  MEETING_USER_PROMISED_TO_VOTE,
  MEETING_CREATE_AUTHORITY,
  MEETING_REMOVE_AUTHORITY,
  MEETING_SHOW_MENU,
  MEETING_EDIT,
  MEETING_PUBLISH,
  MEETING_REGISTRATION_OPEN,
  MEETING_REGISTRATION_CLOSE,
  MEETING_OPEN,
  MEETING_CLOSE,
  MEETING_SUMMARIZE,
  MEETING_AUTHORITIES_TAB,
  MEMBER_REMOVE,
  MEMBER_REMOVE_IMPORT,
  MEMBER_PROMOTE,
  MEMBER_DEMOTE,
  TOGGLE_MEETING_VISIBILITY,
  SHOW_MEETING,

  USER_IMPORT,
  USER_EXPORT,
  USER_MANAGE,

  USER_IS_GUEST,
  USER_IS_MEMBER,
  USER_IS_DIRECTOR,
}
