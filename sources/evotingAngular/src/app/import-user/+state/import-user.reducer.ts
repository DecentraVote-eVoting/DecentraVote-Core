/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {createEntityAdapter, EntityAdapter, EntityState} from "@ngrx/entity";
import {Action, createFeatureSelector, createReducer, on} from "@ngrx/store";
import {ImportUser} from "@import-user/models/import-user.model";
import * as importUserActions from "@import-user/+state/import-user.actions";


export const importUserAdapter: EntityAdapter<ImportUser> = createEntityAdapter<ImportUser>({
  selectId: user => user.id
});

export interface ImportUserState extends EntityState<ImportUser> {
  usersLoading: boolean;
}

export const initialState: ImportUserState = importUserAdapter.getInitialState({
  usersLoading: false,
});

export function reducer(state: ImportUserState | undefined, action: Action): ImportUserState {
  return importUserReducer(state, action);
}

const importUserReducer = createReducer(
  initialState,
  on(importUserActions.LoadImportedUsersAction,
    (state) => ({
      ...state,
      usersLoading: true
    })),
  on(importUserActions.LoadImportedUsersSuccessAction,
    (state, {importedUsers}) => ({
      ...importUserAdapter.setAll(importedUsers, state),
      usersLoading: false
    })),
  on(importUserActions.RemoveImportedUserSuccessAction,
    (state, {id}) => {
      return importUserAdapter.removeOne(id, state);
    }),
);

/*
 * ===============
 * S E L E C T O R
 * ===============
 */
export const getImportUserState = createFeatureSelector<ImportUserState>('importUser');
export const selectors = importUserAdapter.getSelectors(getImportUserState);


export const {
  selectEntities,
  selectAll,
  selectIds
} = importUserAdapter.getSelectors();
