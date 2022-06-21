/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Action, createFeatureSelector, createReducer, createSelector, on} from '@ngrx/store';
import {MeetingModel} from '@meeting/models/meeting.model';
import * as meetingActions from './meeting.actions';
import {MemberRepresentation} from '@meeting/models/meeting-member.model';
import * as voteActions from '@voting/+state/vote.actions';
import {BigNumber} from 'ethers';

export const meetingAdapter: EntityAdapter<MeetingModel> = createEntityAdapter<MeetingModel>({
  selectId: gm => gm.address
});

export interface MeetingState extends EntityState<MeetingModel> {
  addressesAreLoading: boolean;
  meetingsLoadingAddresses: string[];
  isMembersLoading: boolean;
  isMeetingStateChanged: { [key: string]: boolean };
  isMeetingRegistrationStateChanged: { [key: string]: boolean };
  isParticipantRegistering: { [key: string]: boolean };
  showToggleVisibilitySpinner: { [key: string]: boolean };
  showOpenMeetingSpinner: { [key: string]: boolean };
  representationList: Map<string, MemberRepresentation[]>;
}

export const initialState: MeetingState = meetingAdapter.getInitialState({
  addressesAreLoading: false,
  meetingsLoadingAddresses: [],
  isMembersLoading: false,
  isMeetingStateChanged: {},
  isMeetingRegistrationStateChanged: {},
  showToggleVisibilitySpinner: {},
  showOpenMeetingSpinner: {},
  isParticipantRegistering: {},
  representationList: new Map<string, MemberRepresentation[]>(),
});

export function reducer(state: MeetingState | undefined, action: Action): MeetingState {
  return meetingReducer(state, action);
}

const meetingReducer = createReducer(
  initialState,
  on(meetingActions.GetMeetingAddressesAction,
    (state) => {
      return {
        ...state,
        addressesAreLoading: true
      };
    }
  ),
  on(meetingActions.GetMeetingAddressesSuccessAction,
    (state, {meetings}) => {
      return {
        ...state,
        // if there are meetings, don't set this to false yet (instead in GetMeetingDetailSuccessAction),
        // as this might result in flickering getIsMeetingsLoading()
        addressesAreLoading: meetings.length > 0
      };
    }
  ),
  on(meetingActions.GetMeetingDetailAction,
    (state, {address}) => {
      if (address in state.meetingsLoadingAddresses) { return state; }
      return {
        ...state,
        meetingsLoadingAddresses: [...state.meetingsLoadingAddresses, address]
      };
    }
  ),
  on(meetingActions.GetMeetingDetailSuccessAction,
    (state, {meeting}) => {
      state = meetingAdapter.upsertOne(meeting, state);
      return {
        ...state,
        addressesAreLoading: false,
        meetingsLoadingAddresses: [...state.meetingsLoadingAddresses.filter(addr => addr !== meeting.address)]
      };
    }
  ),
  on(meetingActions.ToggleMeetingVisibilityAction,
    (state, {meeting}) => {
      const toggledState = Object.assign({}, state.isMeetingStateChanged);
      toggledState[meeting.address] = true;
      const toggledVisibilitySpinnerState = Object.assign({}, state.showToggleVisibilitySpinner);
      toggledVisibilitySpinnerState[meeting.address] = true;
      return {
        ...state,
        isMeetingStateChanged: toggledState,
        showToggleVisibilitySpinner: toggledVisibilitySpinnerState
      };
    }),
  on(meetingActions.ToggleMeetingVisibilitySuccessAction,
    (state, {meeting}) => {
      const toggledState = Object.assign({}, state.isMeetingStateChanged);
      toggledState[meeting.address] = false;
      const toggledVisibilitySpinnerState = Object.assign({}, state.showToggleVisibilitySpinner);
      toggledVisibilitySpinnerState[meeting.address] = false;
      return {
        ...state,
        isMeetingStateChanged: toggledState,
        showToggleVisibilitySpinner: toggledVisibilitySpinnerState
      };
    }),
  on(meetingActions.OpenRegistrationStageAction,
    (state, {meeting}) => {
      const newRegisteredState = Object.assign({}, state.isMeetingRegistrationStateChanged);
      newRegisteredState[meeting.address] = true;
      return {
        ...state,
        isMeetingRegistrationStateChanged: newRegisteredState
      };
    }),
  on(meetingActions.OpenRegistrationStageSuccessAction,
    (state, {meeting}) => {
      const newRegisteredState = Object.assign({}, state.isMeetingRegistrationStateChanged);
      newRegisteredState[meeting.address] = false;
      return {
        ...state,
        isMeetingRegistrationStateChanged: newRegisteredState
      };
    }),
  on(meetingActions.CloseRegistrationStageAction,
    (state, {meeting}) => {
      const newRegisteredState = Object.assign({}, state.isMeetingRegistrationStateChanged);
      newRegisteredState[meeting.address] = true;
      return {
        ...state,
        isMeetingRegistrationStateChanged: newRegisteredState,
      };
    }),
  on(meetingActions.CloseRegistrationStageSuccessAction,
    (state, {meeting}) => {
      const newRegisteredState = Object.assign({}, state.isMeetingRegistrationStateChanged);
      newRegisteredState[meeting.address] = false;
      return {
        ...state,
        isMeetingRegistrationStateChanged: newRegisteredState
      };
    }),
  on(meetingActions.JoinMeetingAction,
    (state, {meeting}) => {
      const newParticipantRegisteredState = Object.assign({}, state.isParticipantRegistering);
      newParticipantRegisteredState[meeting.address] = true;
      return {
        ...state,
        isParticipantRegistering: newParticipantRegisteredState
      };
    }),
  on(meetingActions.JoinMeetingSuccessAction,
    (state, {meeting}) => {
      const newParticipantRegisteredState = Object.assign({}, state.isParticipantRegistering);
      newParticipantRegisteredState[meeting.address] = true;
      return {
        ...state,
        isParticipantRegistering: newParticipantRegisteredState
      };
    }),
  on(meetingActions.OpenMeetingAction,
    (state, {meeting}) => {
      const newMeetingState = Object.assign({}, state.isMeetingStateChanged);
      newMeetingState[meeting.address] = true;
      const openMeetingSpinnerState = Object.assign({}, state.showOpenMeetingSpinner);
      openMeetingSpinnerState[meeting.address] = true;
      return {
        ...state,
        isMeetingStateChanged: newMeetingState,
        showOpenMeetingSpinner: openMeetingSpinnerState
      };
    }),
  on(meetingActions.OpenMeetingSuccessAction,
    (state, {meeting}) => {
      const newMeetingState = Object.assign({}, state.isMeetingStateChanged);
      newMeetingState[meeting.address] = false;
      const openMeetingSpinnerState = Object.assign({}, state.showOpenMeetingSpinner);
      openMeetingSpinnerState[meeting.address] = false;
      return {
        ...state,
        isMeetingStateChanged: newMeetingState,
        showOpenMeetingSpinner: openMeetingSpinnerState
      };
    }),
  on(meetingActions.CloseMeetingAction,
    (state, {meeting}) => {
      const newMeetingState = Object.assign({}, state.isMeetingStateChanged);
      newMeetingState[meeting.address] = true;
      return {
        ...state,
        isMeetingStateChanged: newMeetingState
      };
    }),
  on(meetingActions.CloseMeetingSuccessAction,
    (state, {meeting}) => {
      const newMeetingState = Object.assign({}, state.isMeetingStateChanged);
      newMeetingState[meeting.address] = false;
      return {
        ...state,
        isMeetingStateChanged: newMeetingState
      };
    }),
  on(voteActions.DeleteVoteEvent,
    (state, {meetingAddress, voteAddress}) => {
      const votes = state.entities[meetingAddress] ? state.entities[meetingAddress].votes : null;
      if (!votes) {
        return state;
      }
      return meetingAdapter.updateOne({
        id: meetingAddress,
        changes: {
          votes: votes.filter(vote => vote !== voteAddress)
        }
      }, state);
    }),
  on(meetingActions.DeleteMeetingEvent,
    (state, {meetingAddress}) => {
      return meetingAdapter.removeOne(meetingAddress, state);
    })
);

/*
 * ===============
 * S E L E C T O R
 * ===============
 */

export const getMeetingState = createFeatureSelector<MeetingState>('meeting');
export const selectors = meetingAdapter.getSelectors(getMeetingState);
export const isMembersLoading = createSelector(getMeetingState, (state: MeetingState) => state.isMembersLoading);

// TODO: Rename to getAuthorityListSelector
export const getAuthorityList = (hashValue: string) => createSelector(getMeetingState,
  (state: MeetingState) => state.representationList.get(hashValue));

export function getIsMeetingsLoading(): (state: MeetingState) => boolean {
  return (state: MeetingState) => {
    return state.addressesAreLoading || state.meetingsLoadingAddresses.length > 0;
  };
}

export function getRegisteredVoterAddressesSelectorFunction(meetingAddress: string): (state: MeetingState) => string[] {
  return (state: MeetingState) => {
    const meeting: MeetingModel = state.entities[meetingAddress];
    return meeting ? meeting.registeredVoters : undefined;
  };
}

export function getRepresentedByDictionarySelectorFunction(meetingAddress: string): (state: MeetingState) => { [key: string]: string } {
  return (state: MeetingState) => {
    const meeting: MeetingModel = state.entities[meetingAddress];
    return meeting ? meeting.representedBy : undefined;
  };
}

export function getMeetingByAddress(meetingAddress: string): (state: MeetingState) => MeetingModel {
  return (state: MeetingState) => state.entities[meetingAddress];
}

// TODO: Rename to 'getMeetingStateChangedSelectorFunction'
export function isMeetingStateChanged(meetingAddress: string): (state: MeetingState) => boolean {
  return (state: MeetingState) => state.isMeetingStateChanged[meetingAddress];
}

// TODO: Rename to 'getIsMeetingRegistrationStateChangedSelectorFunction'
export function isMeetingRegistrationStateChanged(meetingAddress: string): (state: MeetingState) => boolean {
  return (state: MeetingState) => state.isMeetingRegistrationStateChanged[meetingAddress];
}

export function isParticipantRegisteringStateChanged(meetingAddress: string): (state: MeetingState) => boolean {
  return (state: MeetingState) => state.isParticipantRegistering[meetingAddress];
}

export function getToggleVisibilitySpinnerState(meetingAddress: string): (state: MeetingState) => boolean {
  return (state: MeetingState) => state.showToggleVisibilitySpinner[meetingAddress];
}

export function getOpenMeetingSpinnerState(meetingAddress: string): (state: MeetingState) => boolean {
  return (state: MeetingState) => state.showOpenMeetingSpinner[meetingAddress];
}

export function getVoteAddresses(meetingAddress: string): (state: MeetingState) => string[] {
  return (state: MeetingState) => state.entities[meetingAddress].votes;
}

export function getLeaves(meetingAddress: string): (state: MeetingState) => BigNumber[] {
  return (state: MeetingState) => state.entities[meetingAddress].leaves;
}

export const {
  selectEntities,
  selectAll,
  selectIds
} = meetingAdapter.getSelectors();
