/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ActionReducerMap, createFeatureSelector, MetaReducer} from '@ngrx/store';
import {environment} from '../environments/environment';
/**
 * storeFreeze prevents state from being mutated. When mutation occurs, an
 * exception will be thrown. This is useful during development mode to
 * ensure that none of the reducers accidentally mutates the state.
 */
import {storeFreeze} from 'ngrx-store-freeze';

import * as fromMeetings from '@meeting/+state/meeting.reducer';
import * as fromVote from '@voting/+state/vote.reducer';
import * as fromCore from '@core/+state/core.reducer';
import * as fromUser from '@app/user/+state/user.reducer';
import * as fromImportUser from '@import-user/+state/import-user.reducer';
import * as fromBallotBox from '@voting/+state/ballot-box.reducer';

/**
 * Every reducer module's default export is the reducer function itself. In
 * addition, each module should export a type or interface that describes
 * the state of the reducer plus any selector functions. The `* as`
 * notation packages up all of the exports into a single object.
 */

/**
 * As mentioned, we treat each reducer like a table in a database. This means
 * our top level state interface is just a map of keys to inner state types.
 */
export interface State {

  core: fromCore.CoreState;
  vote: fromVote.VoteState;
  meeting: fromMeetings.MeetingState;
  user: fromUser.UserState;
  importUser: fromImportUser.ImportUserState;
  ballotBox: fromBallotBox.BallotBoxState;
}

/**
 * Our state is composed of a map of action reducer functions.
 * These reducer functions are called with each dispatched action
 * and the current or initial state and return a new immutable state.
 */
export const reducers: ActionReducerMap<State> = {

  core: fromCore.reducer,
  vote: fromVote.reducer,
  meeting: fromMeetings.reducer,
  user: fromUser.reducer,
  importUser: fromImportUser.reducer,
  ballotBox: fromBallotBox.reducer
};

/**
 * By default, @ngrx/store uses combineReducers with the reducer map to compose
 * the root meta-reducer. To add more meta-reducers, provide an array of meta-reducers
 * that will be composed to form the root meta-reducer.
 */
export const metaReducers: MetaReducer<State>[] = !(environment.production)
  ? [storeFreeze]
  : [];

/**
 * Layout Reducers
 */

export const getVoteState = createFeatureSelector<fromVote.VoteState>('vote');
export const getMeetingState = createFeatureSelector<fromMeetings.MeetingState>('meeting');
export const getUserState = createFeatureSelector<fromUser.UserState>('user');
export const getImportUserState = createFeatureSelector<fromImportUser.ImportUserState>('importUser');
export const getBallotBoxState = createFeatureSelector<fromBallotBox.BallotBoxState>('ballotBox');
