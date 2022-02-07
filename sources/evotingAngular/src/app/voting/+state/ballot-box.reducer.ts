/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Action, createReducer, on} from '@ngrx/store';
import {BallotBox, VerifiableBallot} from '@voting/models/ballot-box.model';
import * as ballotBox from './ballot-box.actions';

export const ballotBoxAdapter: EntityAdapter<BallotBox> = createEntityAdapter<BallotBox>({
  selectId: vp => vp.voteAddress
});

export interface BallotBoxState extends EntityState<BallotBox> {
}

export const initialState: BallotBoxState = ballotBoxAdapter.getInitialState({});

export function reducer(state: BallotBoxState | undefined, action: Action): BallotBoxState {
  return BallotBoxReducer(state, action);
}

const BallotBoxReducer = createReducer(
  initialState,
  on(ballotBox.GetBallotsSuccess,
    (state, {voteAddress, verifiableBallots}) => ({
      ...ballotBoxAdapter.upsertOne({voteAddress, verifiableBallots}, state)
    }))

);

export const {
  selectEntities,
  selectAll: selectAllVotes,
  selectIds,
  selectTotal, // TODO: see if this is needed
} = ballotBoxAdapter.getSelectors();

export function getVerifiableBallotsByVoteAddress(voteAddress: string): (state: BallotBoxState) => VerifiableBallot[] {
   return (state: BallotBoxState) => state.entities[voteAddress] ? state.entities[voteAddress].verifiableBallots : [];
}
