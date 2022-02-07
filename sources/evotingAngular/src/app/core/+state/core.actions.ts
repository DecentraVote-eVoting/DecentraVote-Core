/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {createAction, props} from '@ngrx/store';
import {ToasterType} from '../models/toaster.model';
import {SimpleEntity} from '../models/common.model';
import {SpinnerInfo} from '../models/spinner.model';
import {BallotBoxServer, StorageServer} from '../models/storage.model';

export const NotificationAction = createAction(
  '[Core] Add Notification',
  props<{ level: SimpleEntity<ToasterType>, message: string, err: any }>()
);
export const LoadStorageUrlsAction = createAction(
  '[Core] Load StorageUrls'
);
export const LoadStorageUrlsSuccessAction = createAction(
  '[Core] Load StorageUrls Success',
  props<{ list: StorageServer[] }>()
);
export const LoadBallotBoxUrlsAction = createAction(
  '[Core] Load BallotBoxUrls'
);
export const LoadBallotBoxUrlsSuccessAction = createAction(
  '[Core] Load BallotBoxUrls Success',
  props<{ list: BallotBoxServer[] }>()
);
export const SetSecretAction = createAction(
  '[Core] Set Secret',
  props<{ secret: string }>()
);
export const GetAuthOptionsAction = createAction(
  '[Core] Get Auth Options'
);
export const GetAuthOptionsSuccessAction = createAction(
  '[Core] Get Auth Options Success',
  props<{ options: string[] }>()
);
export const ErrorAction = createAction(
  '[Core] Error',
  props<{ message: string, spinner?: SpinnerInfo }>()
);
