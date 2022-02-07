/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Action, createFeatureSelector, createReducer, createSelector, on} from '@ngrx/store';
import * as core from './core.actions';
import {BallotBoxServer, StorageServer} from '../models/storage.model';

export interface CoreState {
  authOptions: string[];
  secret: string;
  storageServer: StorageServer[];
  ballotBoxServer: BallotBoxServer[];
  storageServerLoading: boolean;
  ballotBoxServerLoading: boolean;
}

export const initialState: CoreState = {
  authOptions: [],
  secret: null,
  storageServer: [],
  ballotBoxServer: [],
  storageServerLoading: false,
  ballotBoxServerLoading: false,
};

export function reducer(state: CoreState | undefined, action: Action): CoreState {
  return coreReducer(state, action);
}

const coreReducer = createReducer(
  initialState,
  on(core.LoadStorageUrlsAction,
    (state) => ({
      ...state,
      storageServerLoading: true,
    })),
  on(core.LoadStorageUrlsSuccessAction,
    (state, {list}) => ({
      ...state,
      storageServer: list,
      storageServerLoading: false
    })),
  on(core.LoadBallotBoxUrlsAction,
    (state) => ({
      ...state,
      ballotBoxServerLoading: true,
    })),
  on(core.LoadBallotBoxUrlsSuccessAction,
    (state, {list}) => ({
      ...state,
      ballotBoxServer: list,
      ballotBoxServerLoading: false
    })),
  on(core.SetSecretAction,
    (state, {secret}) => ({
      ...state,
      secret: secret
    })),
  on(core.GetAuthOptionsSuccessAction,
    (state, {options}) => ({
      ...state,
      authOptions: options
    })),
  on(core.ErrorAction,
    (state) => ({
      ...state,
      storageServerLoading: false,
      ballotBoxServerLoading: false,
      membersLoading: false
    })),
);

export const coreState = createFeatureSelector<CoreState>('core');
export const getSecret = createSelector(coreState, (state: CoreState) => state.secret);
export const getStorageServer = createSelector(coreState, (state: CoreState) => state.storageServer);
export const getBallotBoxServer = createSelector(coreState, (state: CoreState) => state.ballotBoxServer);
export const areServersLoading = createSelector(coreState, (state: CoreState) => state.storageServerLoading || state.ballotBoxServerLoading);
export const getAuthOptions = createSelector(coreState, (state: CoreState) => state.authOptions);
