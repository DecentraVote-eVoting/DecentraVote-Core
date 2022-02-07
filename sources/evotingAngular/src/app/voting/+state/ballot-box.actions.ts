/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {createAction, props} from '@ngrx/store';
import {VerifiableBallot} from '@voting/models/ballot-box.model';


export const GetBallotsFromBallotBoxService = createAction(
  '[Vote] Get Ballots From BallotBox Service',
  props<{ voteAddress: string, isAnonymous: boolean }>()
);

export const GetBallotsFromStorageService = createAction(
  '[Vote] Get Ballots From Storage with Hash',
  props<{ voteAddress: string, treeHash: string, isAnonymous: boolean}>()
);

export const GetBallotsSuccess = createAction(
  '[Vote] Get Ballots Success',
  props<{ voteAddress: string, verifiableBallots: VerifiableBallot[] }>()
);
