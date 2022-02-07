/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {createAction, props} from '@ngrx/store';
import {MeetingModel} from '@meeting/models/meeting.model';
import {SpinnerInfo} from '@core/models/spinner.model';
import {User} from '@app/user/models/user.model';

export const GetMeetingAddressesAction = createAction(
  '[Meeting] Get Meeting Addresses'
);

export const GetMeetingAddressesSuccessAction = createAction(
  '[Meeting] Get Meeting Addresses Success',
  props<{ meetings: MeetingModel[] }>()
);

export const GetMeetingDetailAction = createAction(
  '[Meeting] Get Meeting Detail',
  props<{ address: string }>()
);

export const GetMeetingDetailSuccessAction = createAction(
  '[Meeting] Get Meeting Detail Success',
  props<{ meeting: MeetingModel }>()
);

export const SortVotesOfMeetingAction = createAction(
  '[Vote] Sort Votes',
  props<{meetingAddress: string, voteAddresses: string[] }>()
);

export const SortVotesOfMeetingSuccessAction = createAction(
  '[Vote] Sort Votes Success'
);

export const UpdateMeetingAction = createAction(
  '[Meeting] Update Meeting',
  props<{ meeting: MeetingModel }>()
);

export const UpdateMeetingSuccessAction = createAction(
  '[Meeting] Update Meeting Success',
  props<{ meeting: MeetingModel }>()
);

export const CreateMeetingAction = createAction(
  '[Meeting] Create Meeting',
  props<{ meeting: MeetingModel }>()
);

export const CreateMeetingSuccessAction = createAction(
  '[Meeting] Create Meeting Success'
);

export const OpenMeetingAction = createAction(
  '[Meeting] Open Meeting',
  props<{ meeting: MeetingModel }>()
);

export const OpenMeetingSuccessAction = createAction(
  '[Meeting] Open Meeting Success',
  props<{ meeting: MeetingModel }>()
);

export const CloseMeetingAction = createAction(
  '[Meeting] Close Meeting',
  props<{ meeting: MeetingModel }>()
);

export const CloseMeetingSuccessAction = createAction(
  '[Meeting] Close Meeting Success',
  props<{ meeting: MeetingModel }>()
);

export const ToggleMeetingVisibilityAction = createAction(
  '[Meeting] Toggle Meeting Visibility',
  props<{ meeting: MeetingModel }>()
);

export const ToggleMeetingVisibilitySuccessAction = createAction(
  '[Meeting] Toggle Meeting Visibility Success',
  props<{ meeting: MeetingModel }>()
);

export const OpenRegistrationStageAction = createAction(
  '[Meeting] Open Registration Stage',
  props<{ meeting: MeetingModel }>()
);
export const OpenRegistrationStageSuccessAction = createAction(
  '[Meeting] Open Registration Stage Success',
  props<{ meeting: MeetingModel }>()
);
export const CloseRegistrationStageAction = createAction(
  '[Meeting] Close Registration Stage',
  props<{ meeting: MeetingModel }>()
);
export const CloseRegistrationStageSuccessAction = createAction(
  '[Meeting] Close Registration Stage Success',
  props<{ meeting: MeetingModel }>()
);

export const JoinMeetingAction = createAction(
  '[Meeting] Join Meeting',
  props<{ meeting: MeetingModel }>()
);
export const JoinMeetingSuccessAction = createAction(
  '[Meeting] Join Meeting Success',
  props<{ meeting: MeetingModel }>()
);

export const DeleteMeetingAction = createAction(
  '[Meeting] Delete Meeting',
  props<{ meetingAddress: string}>()
);
export const DeleteMeetingSuccessAction = createAction(
  '[Meeting] Delete Meeting Success',
  props<{ meetingAddress: string}>()
);

export const DeleteMeetingEvent = createAction(
  '[Meeting] Received Event to Delete a Meeting',
  props<{ meetingAddress: string}>()
);

/* --- Representation Actions --- */
export const AddRepresentationAction = createAction(
  '[Meeting] Create Representation',
  props<{ meeting: MeetingModel, representeeAddress: string, representativeAddress: string }>()
);
export const AddRepresentationSuccessAction = createAction(
  '[Meeting] Add Representation Success',
  props<{ meeting: MeetingModel }>()
);
export const RemoveRepresentationAction = createAction(
  '[Meeting] Remove Representation',
  props<{ meeting: MeetingModel, member: User }>()
);
export const RemoveRepresentationSuccessAction = createAction(
  '[Meeting] Remove Representation Success',
  props<{ meeting: MeetingModel }>()
);

export const ErrorAction = createAction(
  '[Meeting] Error',
  props<{ message: string, spinner?: SpinnerInfo }>()
);
