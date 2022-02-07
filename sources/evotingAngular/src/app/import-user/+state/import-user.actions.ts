/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {createAction, props} from '@ngrx/store';
import {ImportUser} from '@import-user/models/import-user.model';

export const LoadImportedUsersAction = createAction(
  '[Import-User] Load Import Users'
);
export const LoadImportedUsersSuccessAction = createAction(
  '[Import-User] Load Import Users Success',
  props<{ importedUsers: ImportUser[] }>()
);
export const RemoveImportedUserAction = createAction(
  '[Import-User] Remove Import User',
  props<{ id: number, email: string }>()
);
export const RemoveImportedUserSuccessAction = createAction(
  '[Import-User] Remove Import User Success',
  props<{ id: number }>()
);
export const EditImportUserAction = createAction(
  '[Import-User] Edit Import Users',
  props<{ editedImportUser: ImportUser }>()
);
export const EditImportUserSuccessAction = createAction(
  '[User] Edit Import User Success'
);
