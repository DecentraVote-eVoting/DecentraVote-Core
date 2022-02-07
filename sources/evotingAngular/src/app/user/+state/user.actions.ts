/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {createAction, props} from '@ngrx/store';
import {User} from '@app/user/models/user.model';
import {BigNumber} from 'ethers';

export const LoadUsersAction = createAction(
  '[User] Load Users'
);
export const LoadUsersSuccessAction = createAction(
  '[User] Load Users Success',
  props<{ users: User[] }>()
);
export const GetUserDetailAction = createAction(
  '[User] Get User Detail',
  props<{ userAddress: string, claimHash: string, roleNumber: BigNumber }>()
);
export const GetUserDetailSuccessAction = createAction(
  '[User] Get User Detail Success',
  props<{ user: User }>()
);
export const RemoveUserAction = createAction(
  '[User] Remove User',
  props<{ address: string, claimHash: string }>()
);
export const RemoveUserSuccessAction = createAction(
  '[User] Remove User Success',
  props<{ address: string }>()
);
export const EditUserAction = createAction(
  '[User] Edit User',
  props<{ user: User }>()
);
export const EditUserSuccessAction = createAction(
  '[User] Edit User Success'
);
