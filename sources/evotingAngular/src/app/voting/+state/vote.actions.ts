/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {createAction, props} from '@ngrx/store';
import {AnonymousRoot, CreateVoteModel, VoteModel} from '@voting/models/vote.model';
import {SpinnerInfo} from '@core/models/spinner.model';
import {StorageArchiveReason, StorageVote} from '@core/models/storage.model';
import {VoteStage} from '@voting/models/vote-stage.enum';


export const GetVoteAddressesAction = createAction(
  '[Vote] Get Vote Addresses',
  props<{ generalMeetingAddress: string }>()
);
export const GetVoteAddressesSuccessAction = createAction(
  '[Vote] Get Vote Addresses Success',
  props<{ voteModel: VoteModel[] }>()
);
export const GetVoteDetailAction = createAction(
  '[Vote] Get Vote Detail',
  props<{ voteAddress: string, external?: boolean }>()
);
export const GetVoteDetailSuccessAction = createAction(
  '[Vote] Get Vote Detail Success',
  props<{ voteRaw: VoteModel }>()
);

export const CreateVoteAction = createAction(
  '[Vote] Create Vote',
  props<{ voteModel: CreateVoteModel, metaData: StorageVote, attachment: Blob }>()
);

export const CreateVoteSuccessAction = createAction(
  '[Vote] Create Vote Success'
);

export const EditVoteAction = createAction(
  '[Vote] Edit Vote',
  props<{ voteModel: CreateVoteModel, metaData: StorageVote, attachment: Blob }>()
);
export const EditVoteSuccessAction = createAction(
  '[Vote] Edit Vote Success',
  props<{ voteAddress: string }>()
);

export const ChangeStageAction = createAction(
  '[Vote] Change Stage',
  props<{ voteModel: CreateVoteModel, stage: VoteStage, reason?: StorageArchiveReason }>()
);
export const ChangeStageSuccessAction = createAction(
  '[Vote] Change Stage Success',
  props<{ voteModel: CreateVoteModel, stage: VoteStage, reason?: string }>()
);

export const CastVoteAction = createAction(
  '[Vote] Cast Vote',
  props<{ voteOptions: string[], voteAddress: string, startIndex: number}>()
);

export const CastVoteSuccessAction = createAction(
  '[Vote] Cast Vote Success',
  props<{ voteAddress: string }>()
);

export const ProcessingVotesSuccessAction = createAction(
  '[Vote] Cast Vote Success',
  props<{ voteAddress: string }>()
);

export const ExcludeFromVoteAction = createAction(
  '[Vote] Exclude From Vote',
  props<{ voteAddress: string, addressesToBlock: string[] }>()
);
export const ExcludeFromVoteSuccessAction = createAction(
  '[Vote] Exclude From Vote Success',
  props<{ voteAddress: string, addressesToBlock: string[] }>()
);

export const AnonymousAccountAlreadyRegisteredAction = createAction(
  '[Vote] This account is already Registered',
  props<{ root: string | AnonymousRoot, index: number, address: string }>()
);

export const DeleteVoteAction = createAction(
  '[Vote] Delete Vote',
  props<{ meetingAddress: string, voteAddress: string }>()
);
export const DeleteVoteSuccessAction = createAction(
  '[Vote] Delete Vote Success',
  props<{ meetingAddress: string, voteAddress: string }>()
);

export const DeleteVoteEvent = createAction(
  '[Vote] Received Event to Delete a Vote',
  props<{ meetingAddress: string, voteAddress: string }>()
);

export const ErrorAction = createAction(
  '[Vote] Error',
  props<{ message: string, spinner?: SpinnerInfo }>()
);
