/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {User} from '@app/user/models/user.model';
import {Action, createFeatureSelector, createReducer, on} from '@ngrx/store';
import * as userActions from '@app/user/+state/user.actions';
import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Role} from '@user/models/role.model';

export const userAdapter: EntityAdapter<User> = createEntityAdapter<User>({
  selectId: user => user.address
});

export interface UserState extends EntityState<User> {
  usersLoading: boolean;
}

export const initialState: UserState = userAdapter.getInitialState({
  usersLoading: false,
});

export function reducer(state: UserState | undefined, action: Action): UserState {
  return userReducer(state, action);
}

const userReducer = createReducer(
  initialState,
  on(userActions.LoadUsersAction,
    (state) => ({
      ...state,
      usersLoading: true
    })),
  on(userActions.LoadUsersSuccessAction,
    (state, {users}) => ({
      ...userAdapter.upsertMany(users, state),
      usersLoading: false
    })),
  on(userActions.RemoveUserSuccessAction,
    (state, {address}) => {
      return userAdapter.removeOne(address, state);
    }),
  on(userActions.GetUserDetailSuccessAction,
    (state, {user}) => {
      return userAdapter.upsertOne(user, state);
    })
);

/*
 * ===============
 * S E L E C T O R
 * ===============
 */
export const getUserState = createFeatureSelector<UserState>('user');
export const selectors = userAdapter.getSelectors(getUserState);

export function getUserByAddress(memberAddress: string): (state: UserState) => User {
  return (state: UserState) => state.entities[memberAddress] ? state.entities[memberAddress] : undefined;
}

export function getIsUserLoading(): (state: UserState) => boolean {
  return (state: UserState) => state.usersLoading;
}

export function getValidUsers(): (state: UserState) => User[] {
  return (state: UserState) => selectAll(state)
    .filter((user: User) => user.role.value > Role.NONE.value);
}

export function getMember(): (state: UserState) => User[] {
  return (state: UserState) => selectAll(state)
    .filter((user: User) => user.role.isRole(Role.MEMBER));
}

export function getGuest(): (state: UserState) => User[] {
  return (state: UserState) => selectAll(state)
    .filter((user: User) => user.role.isRole(Role.GUEST));
}

export function getDirector(): (state: UserState) => User[] {
  return (state: UserState) => selectAll(state)
    .filter((user: User) => user.role.isRole(Role.DIRECTOR));
}

export const {
  selectEntities,
  selectAll,
  selectIds
} = userAdapter.getSelectors();
