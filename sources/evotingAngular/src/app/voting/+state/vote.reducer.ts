/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {VoteModel} from '@voting/models/vote.model';
import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Action, createReducer, on} from '@ngrx/store';
import * as vote from './vote.actions';
import {VoteStage} from '@voting/models/vote-stage.enum';
import {BigNumber} from 'ethers';

export const voteAdapter: EntityAdapter<VoteModel> = createEntityAdapter<VoteModel>({
  selectId: vp => vp.address
});

export interface VoteState extends EntityState<VoteModel> {
  voteLoading: boolean;
  castVoteLoading: { [key: string]: boolean };
  isVoteArchiving: { [key: string]: boolean };
  isVoteStateLoading: { [key: string]: boolean };
  isProcessingVotes: { [key: string]: boolean };
  isVerifyingVotes: { [key: string]: boolean };
  dispatchedMemberExclusion: { [key: string]: { address: string, toBeExcluded: boolean }[] };
}

export const initialState: VoteState = voteAdapter.getInitialState({
  voteLoading: false,
  castVoteLoading: {},
  isVoteArchiving: {},
  isVoteStateLoading: {},
  isProcessingVotes: {},
  isVerifyingVotes: {},
  dispatchedMemberExclusion: {},
});

export function reducer(state: VoteState | undefined, action: Action): VoteState {
  return VoteReducer(state, action);
}

const VoteReducer = createReducer(
  initialState,
  on(vote.ErrorAction,
    (state) => ({
      ...state,
      castVoteLoading: {},
      voteLoading: false
    })),
  on(vote.GetVoteAddressesAction,
    (state) => ({
      ...state,
      voteLoading: true
    })),
  on(vote.GetVoteAddressesSuccessAction,
    (state, {voteModel}) => ({
      ...voteAdapter.upsertMany(voteModel, state),
      voteLoading: false
    })),
  on(vote.GetVoteDetailAction,
    (state) => ({
      ...state,
      voteLoading: true
    })),
  on(vote.GetVoteDetailSuccessAction,
    (state, {voteRaw}) => ({
      ...voteAdapter.upsertOne(voteRaw, state),
      voteLoading: false
    })),
  on(vote.ChangeStageAction,
    (state, {voteModel, stage}) => {
      let mapping;
      let isArchiving: boolean;
      switch (stage) {
        case VoteStage.ARCHIVED:
          mapping = Object.assign({}, state.isVoteArchiving);
          isArchiving = true;
          break;
        case VoteStage.CLOSED:
          const newIsProcessingVotesStage = Object.assign({}, state.isProcessingVotes);
          newIsProcessingVotesStage[voteModel.address] = true;
          return {
            ...state,
            isProcessingVotes: newIsProcessingVotesStage
          };
        default:
          mapping = Object.assign({}, state.isVoteStateLoading);
          isArchiving = false;
          break;
      }

      mapping[voteModel.address] = true;
      return {
        ...state,
        isVoteArchiving: isArchiving ? mapping : state.isVoteArchiving,
        isVoteStateLoading: isArchiving ? state.isVoteStateLoading : mapping
      };
    }),
  on(vote.ChangeStageSuccessAction,
    (state, {voteModel, stage}) => {
      let mapping;
      let isArchiving: boolean;
      switch (stage) {
        case VoteStage.ARCHIVED:
          mapping = Object.assign({}, state.isVoteArchiving);
          isArchiving = true;
          break;
        default:
          mapping = Object.assign({}, state.isVoteStateLoading);
          isArchiving = false;
          break;
      }

      mapping[voteModel.address] = false;
      return {
        ...state,
        isVoteArchiving: isArchiving ? mapping : state.isVoteArchiving,
        isVoteStateLoading: isArchiving ? state.isVoteStateLoading : mapping
      };
    }),
  on(vote.CastVoteAction,
    (state, {voteAddress}) => {
      const newLoadingState = Object.assign({}, state.castVoteLoading);
      newLoadingState[voteAddress] = true;
      return {
        ...state,
        castVoteLoading: newLoadingState
      };
    }),
  on(vote.ProcessingVotesSuccessAction,
    (state, {voteAddress}) => {
      const newIsProcessingVotesStage = Object.assign({}, state.isProcessingVotes);
      newIsProcessingVotesStage[voteAddress] = false;
      return {
        ...state,
        isProcessingVotes: newIsProcessingVotesStage
      };
    }),
  on(vote.CastVoteSuccessAction,
    (state, {voteAddress}) => {
      const newLoadingState = Object.assign({}, state.castVoteLoading);
      newLoadingState[voteAddress] = false;
      return {
        ...state,
        castVoteLoading: newLoadingState
      };
    }),
  on(vote.DeleteVoteEvent,
    (state, {meetingAddress, voteAddress}) => {
      return voteAdapter.removeOne(voteAddress, state);
    }),
  on(vote.ExcludeFromVoteAction,
    (state, {voteAddress, addressesToBlock}) => {
      const excludedList = state.entities[voteAddress].excludedList;
      const toBeExcluded = addressesToBlock.filter(e => !excludedList.includes(e));
      const toBeIncluded = excludedList.filter(e => !addressesToBlock.includes(e));

      const newDispatchedMemberExclusion = {};
      toBeExcluded.forEach(excluded =>
        (newDispatchedMemberExclusion[voteAddress] = newDispatchedMemberExclusion[voteAddress] || [])
        .push({ address: excluded, toBeExcluded: true}));
      toBeIncluded.forEach(included =>
        (newDispatchedMemberExclusion[voteAddress] = newDispatchedMemberExclusion[voteAddress] || [])
          .push({ address: included, toBeExcluded: false}));

      return {
        ...state,
        dispatchedMemberExclusion: newDispatchedMemberExclusion
      };
    }),
  on(vote.ExcludeFromVoteSuccessAction,
    (state, {voteAddress, addressesToBlock}) => {
      const newDispatchedMemberExclusion = { voteAddress: [] };
      state = voteAdapter.upsertOne({...state.entities[voteAddress], excludedList: addressesToBlock}, state);
      return {
        ...state,
        dispatchedMemberExclusion: newDispatchedMemberExclusion
      };
    })
);


export const {
  selectEntities,
  selectAll: selectAllVotes,
  selectIds,
  selectTotal, // TODO: see if this is needed
} = voteAdapter.getSelectors();

export function getVotesByMeeting(generalMeetingAddress: string): (s: VoteState) => VoteModel[] {
  return (state: VoteState) => selectAllVotes(state)
    .filter(val => val.parentGeneralMeeting === generalMeetingAddress);
}

export function getVoteAddressesByMeeting(generalMeetingAddress: string): (s: VoteState) => string[] {
  return (state: VoteState) => selectAllVotes(state)
    .filter(val => val.parentGeneralMeeting === generalMeetingAddress)
    .map(voteModel => voteModel.address);
}

export function getNumberOfVotesByMeeting(generalMeetingAddress: string): (s: VoteState) => number {
  return (state: VoteState) => selectAllVotes(state)
    .filter(val => val.parentGeneralMeeting === generalMeetingAddress)
    .length;
}

export function getVoteByAddress(voteAddress: string): (s: VoteState) => VoteModel {
  return (state: VoteState) => selectEntities(state)[voteAddress];
}

export function getParentGeneralMeeting(voteAddress: string): (state: VoteState) => string {
  return (state: VoteState) => state.entities[voteAddress] ? state.entities[voteAddress].parentGeneralMeeting : undefined;
}

export const isVoteLoading = (state: VoteState) => state.voteLoading;

export function isProcessingVote(voteAddress: string): (state: VoteState) => boolean {
  return (state: VoteState) => state.isProcessingVotes[voteAddress];
}

export function isVerifyingVotes(voteAddress: string): (state: VoteState) => boolean {
  return (state: VoteState) => state.isVerifyingVotes[voteAddress];
}

export function isCastVoteLoading(voteAddress: string): (state: VoteState) => boolean {
  return (state: VoteState) => state.castVoteLoading[voteAddress];
}

export function isVotingArchiveStateChanged(voteAddress: string): (state: VoteState) => boolean {
  return (state: VoteState) => state.isVoteArchiving[voteAddress];
}

export function isVoteLoadingStateChanged(voteAddress: string): (state: VoteState) => boolean {
  return (state: VoteState) => state.isVoteStateLoading[voteAddress];
}

export function getLeavesByAddress(voteAddress: string): (state: VoteState) => BigNumber[] {
  return (state: VoteState) => state.entities[voteAddress] ? state.entities[voteAddress].leaves : undefined;
}

export function getExcludedList(voteAddress: string): (state: VoteState) => string[] {
  return (state: VoteState) => state.entities[voteAddress] ? state.entities[voteAddress].excludedList : undefined;
}

export function getOptionHashes(voteAddress: string): (state: VoteState) => string[] {
  return (state: VoteState) => state.entities[voteAddress] ? state.entities[voteAddress].optionHashes : undefined;
}

export function getMetaDataHash(voteAddress: string): (state: VoteState) => string {
  return (state: VoteState) => state.entities[voteAddress] ? state.entities[voteAddress].metadataHash : undefined;
}

export function getChairmanPublicKey(voteAddress: string): (state: VoteState) => string[] {
  return (state: VoteState) => state.entities[voteAddress] ? state.entities[voteAddress].chairpersonPublicKey : undefined;
}

export function getChairmanPrivateKey(voteAddress: string): (state: VoteState) => BigNumber {
  return (state: VoteState) => state.entities[voteAddress] ? state.entities[voteAddress].chairpersonPrivateKey : undefined;
}

export function getIsAnonymous(voteAddress: string): (state: VoteState) => boolean {
  return (state: VoteState) => state.entities[voteAddress] ? state.entities[voteAddress].isAnonymous : undefined;
}

export function getStage(voteAddress: string): (state: VoteState) => VoteStage {
  return (state: VoteState) => state.entities[voteAddress] ? state.entities[voteAddress].stage : undefined;
}

export function getRoot(voteAddress: string): (state: VoteState) => BigNumber {
  return (state: VoteState) => state.entities[voteAddress] ? state.entities[voteAddress].root : undefined;
}

export function getIndex(voteAddress: string): (state: VoteState) => BigNumber {
  return (state: VoteState) => state.entities[voteAddress] ? state.entities[voteAddress].index : undefined;
}

export function getAttachmentHash(voteAddress: string): (state: VoteState) => string {
  return (state: VoteState) => state.entities[voteAddress] ? state.entities[voteAddress].attachmentHash : undefined;
}

export function getReasonHash(voteAddress: string) {
  return (state: VoteState) => state.entities[voteAddress] ? state.entities[voteAddress].reasonHash : undefined;
}

export function getMemberExclusionLoadingState(voteAddress: string): (state: VoteState) => { address: string, toBeExcluded: boolean }[] {
  return (state: VoteState) => state.dispatchedMemberExclusion[voteAddress];
}
