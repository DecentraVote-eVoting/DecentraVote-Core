/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {StorageService} from '@core/services/storage.service';
import * as meetingReducer from '@meeting/+state/meeting.reducer';
import * as meetingActions from '@meeting/+state/meeting.actions';
import * as fromRoot from '../../app.store';
import {Observable} from 'rxjs/Observable';
import {createSelector, select, Store} from '@ngrx/store';
import {filter, map, shareReplay, switchMap} from 'rxjs/operators';
import {combineLatest, of, zip} from 'rxjs';
import {
  MemberRepresentation,
  MemberWithPotentialVotingCount,
  MemberWithVotingCount
} from '@meeting/models/meeting-member.model';
import {MeetingDetailModel, MeetingModel} from '@meeting/models/meeting.model';
import {EthersService} from '@core/services/ethers.service';
import {deepDistinctUntilChanged} from '@core/utils/pipe.util';
import memoizee from 'memoizee';
import {BigNumber} from 'ethers';
import {UserFacade} from '@app/user/services/user.facade';
import {User} from '@app/user/models/user.model';
import {StorageMetaData} from '@core/models/storage.model';

@Injectable({
  providedIn: 'root'
})
export class MeetingFacade {
  constructor(private ethersService: EthersService,
              private storageService: StorageService,
              private store: Store<fromRoot.State>,
              private memberFacade: UserFacade
  ) {
  }

  /**
   * returns a selector of all addresses in a given meeting
   * @param {string} meetingAddress
   * @return {Observable<string[]>}
   */
  getRegisteredVoterAddresses: ((string) => Observable<string[]>) = memoizee((meetingAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getMeetingState,
          meetingReducer.getRegisteredVoterAddressesSelectorFunction(meetingAddress)
        )
      )
    );
  });

  /**
   * returns the number of votes for a meeting
   * @param {string} meetingAddress
   * @return {Observable<number>}
   */
  getNumberOfVotesByMeeting: ((string) => Observable<number>) = memoizee((meetingAddress: string) => {
    return this.getVoteAddresses(meetingAddress).pipe(
      map(votes => votes.length)
    );
  });

  /**
   * returns a selector of the representedBy dict
   * @param {string} meetingAddress
   * @return {Observable<{[key: string]: string}>} key: representee's address, value: representative's address
   */
  getRepresentedByDictionary: ((string) => Observable<{ [key: string]: string }>) = memoizee((meetingAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getMeetingState,
          meetingReducer.getRepresentedByDictionarySelectorFunction(meetingAddress)
        )
      ),
      filter(val => !!val)
    );
  });

  /**
   * returns all registered members for a given meeting and calculates their voting counts
   * @param {string} meetingAddress
   * @return {Observable<MemberWithVotingCount[]>} contains number of available votes and extends member
   */
  getMembersWithVotingCount: ((string) => Observable<MemberWithVotingCount[]>) = memoizee((meetingAddress: string) => {

    return combineLatest([
      this.getMembersByMeetingAddress(meetingAddress),
      this.getRepresentedByDictionary(meetingAddress)]
    ).pipe(
      map(([members, representedBy]) => {
        const counts: { [key: string]: number } = {};

        // for voters that represent or are represented, calculate their voting counts
        for (const address in representedBy) {
          const representative = representedBy[address];

          if (counts[representative] === undefined) {
            // assuming that counts start at 1 and 1 vote has been granted
            counts[representative] = 2;
          } else {
            counts[representative]++;
          }

          // set voting count of representee to 0
          counts[address] = 0;
        }

        return members.map(member => {
          return {
            ...member,
            // set count to 1 for anyone not yet accounted for (aka not included in "representedBy" dict)
            votingCount: counts[member.address] === undefined ? 1 : counts[member.address]
          } as MemberWithVotingCount;
        });
      }),
      deepDistinctUntilChanged()
    );
  });
  /**
   * returns all Members that could vote
   * @param {string} meetingAddress
   * @return {Observable<MemberWithPotentialVotingCount[]} contains number of potential votes and extends member
   */
  getAllMembersWithPotentialVotingCount: ((string) => Observable<MemberWithPotentialVotingCount[]>) = memoizee((meetingAddress: string) => {
    return combineLatest([
      this.memberFacade.getMembers(),
      this.getRepresentedByDictionary(meetingAddress)
    ]).pipe(
      map(([members, representedBy]) => {
          const counts: { [address: string]: number } = {};

          for (const representee in representedBy) {
            const representative = representedBy[representee];
            if (counts[representative] === undefined) { // Representative gets his first additional vote
              counts[representative] = 2;
            } else {
              counts[representative]++;
            }

            // Representee loses vote
            counts[representee] = 0;
          }

          return members.map(member => {
            return <MemberWithPotentialVotingCount>{
              ...member,
              potentialVotingCount: counts[member.address] === undefined ? 1 : counts[member.address]
            };
          });
        }
      ),
      deepDistinctUntilChanged()
    );
  });

  /**
   * returns all representees of the given meeting, registered or not
   * @param {string} meetingAddress
   * @return {Observable<MemberWithVotingCount[]>} contains number of available votes and extends member
   */
  getRepresenteeWithVotingCount: ((string) => Observable<MemberWithVotingCount[]>) = memoizee((meetingAddress: string) => {
    return this.getRepresentedByDictionary(meetingAddress).pipe(
      map(dict => Object.keys(dict)),
      switchMap((addresses: string[]) => {
          return zip(...addresses.map(address => this.memberFacade.getUserByAddress(address)));
        }
      ),
      map((members: User[]) => {
        return members.map(member => {
          return {
            ...member,
            votingCount: 0
          } as MemberWithVotingCount;
        });
      })
    );
  });

  /**
   * returns all member representations
   * because getMultipleMembersByAddresses removes duplicates,
   * the dictionary is needed to map both arrays for a complete list of representations
   * this is not very performant but necessary for the reason stated above
   * @param {string} meetingAddress
   * @return {Observable<MemberRepresentation[]>} contains member and the member who represents him/her
   */
  getMemberRepresentations: ((string) => Observable<MemberRepresentation[]>) = memoizee((meetingAddress: string) => {
    return this.getRepresentedByDictionary(meetingAddress).pipe(
      switchMap(representedBy => {
        const representeeAddresses: string[] = Object.keys(representedBy);
        const representativeAddresses: string[] = Object.values(representedBy);

        if (representeeAddresses.length === 0 || representativeAddresses.length === 0) {
          return of([]);
        }
        return combineLatest([
            zip(...representeeAddresses.map(address => this.memberFacade.getUserByAddress(address))),
            zip(...representativeAddresses.map(address => this.memberFacade.getUserByAddress(address)))
          ]
        ).pipe(
          deepDistinctUntilChanged(),
          map(([representees, representatives]: [User[], User[]]) => {
            const representations: MemberRepresentation[] = [];
            representees.forEach(representee => {
              const representativeAddress = representedBy[representee.address];
              const representative: User = representatives.find(member => {
                return member.address === representativeAddress;
              });
              representations.push({representee: representee, representative: representative});
            });
            return representations;
          })
        );
      }),
    );
  });

  /**
   * returns all members of a specific meetingAddress
   * @param {string} meetingAddress
   * @return {Observable<User[]>} contains personal information for a member such as name
   */
  getMembersByMeetingAddress: ((string) => Observable<User[]>) = memoizee((meetingAddress: string) => {
    return this.getRegisteredVoterAddresses(meetingAddress).pipe(
      switchMap((addresses: string[]) => {
        return zip(...addresses.map(address => this.memberFacade.getUserByAddress(address)));
      })
    );
  });

  /**
   * returns meeting by address
   * @param {string} meetingAddress
   * @return {Observable<MeetingModel>}
   */
  getMeetingByAddress: ((string) => Observable<MeetingModel>) = memoizee((meetingAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getMeetingState,
          meetingReducer.getMeetingByAddress(meetingAddress)
        )
      )
    );
  });

  /**
   * returns all meetings that exist in this organization
   * @return {Observable<MeetingModel[]>} contains information for a meeting for a member who has given
   * his authority to another member
   */
  getMeetings: (() => Observable<MeetingModel[]>) = memoizee(() => {
    return this.store.pipe(
      map(meetingReducer.selectors.selectAll),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns a MeetingDetailmodel for a given meeting by Address
   * @param {string} meetingAddress
   * @return {Observable<MeetingDetailModel>} extends MeetingModel and contains if member has given away his authority and his promise to vote
   */
  getMeetingDetailModel: ((string) => Observable<MeetingDetailModel>) = memoizee((meetingAddress: string) => {
    return combineLatest([
      this.getMeetingByAddress(meetingAddress),
      this.getPromisedToVote(meetingAddress),
      this.getHasGivenAuthority(meetingAddress)
    ]).pipe(
      map(([meeting, promisedToVote, hasGivenAuthority]) => {
        return {
          ...meeting,
          promisedToVote,
          hasGivenAuthority
        } as MeetingDetailModel;
      }),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns the vote Addresses of a given meeting
   * @param {string} meetingAddress
   * @return {Observable<string[]>}
   */
  getVoteAddresses: ((string) => Observable<string[]>) = memoizee((meetingAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getMeetingState,
          meetingReducer.getVoteAddresses(meetingAddress)
        )
      ),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns if meeting state is changed
   * @param {string} meetingAddress
   * @return {Observable<boolean>}
   */
  getMeetingStateChanged: ((string) => Observable<boolean>) = memoizee((meetingAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getMeetingState,
          meetingReducer.isMeetingStateChanged(meetingAddress)
        )
      ),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns if the meetings registration State has changed
   * @param {string} meetingAddress
   * @return {Observable<boolean>}
   */
  getMeetingRegistrationStateChanged: ((string) => Observable<boolean>) = memoizee((meetingAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getMeetingState,
          meetingReducer.isMeetingRegistrationStateChanged(meetingAddress)
        )
      )
    );
  });

  /**
   * returns if a participants registration status has changed
   * @param {string} meetingAddress
   * @return {Observable<boolean>}
   */
  getParticipantRegistrationStateChanged: ((string) => Observable<boolean>) = memoizee((meetingAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getMeetingState,
          meetingReducer.isParticipantRegisteringStateChanged(meetingAddress)
        )
      )
    );
  });

  /**
   * returns Visibility State from state
   * @param {string} meetingAddress
   * @return {Observable<boolean>}
   */
  getToggleVisibilitySpinnerState: ((string) => Observable<boolean>) = memoizee((meetingAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getMeetingState,
          meetingReducer.getToggleVisibilitySpinnerState(meetingAddress)
        )
      )
    );
  });

  /**
   * returns SpinnerState from state
   * @param {string} meetingAddress
   * @return {Observable<boolean>}
   */
  getOpenMeetingSpinnerState: ((string) => Observable<boolean>) = memoizee((meetingAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getMeetingState,
          meetingReducer.getOpenMeetingSpinnerState(meetingAddress)
        )
      )
    );
  });

  /**
   * returns Leaves from Store
   * @param {string} meetingAddress
   * @return {Observable<BigNumber[]>}
   */
  getLeaves: ((string) => Observable<BigNumber[]>) = memoizee((meetingAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getMeetingState,
          meetingReducer.getLeaves(meetingAddress)
        )
      )
    );
  });

  /**
   * returns a boolean depending on whether the signed in user is registered in a given meeting
   * @param {string} meetingAddress
   * @return {Observable<boolean>}
   */
  getPromisedToVote: ((string) => Observable<boolean>) = memoizee((meetingAddress: string) => {
    return combineLatest([
      this.getRegisteredVoterAddresses(meetingAddress),
      this.ethersService.getSignerAddress()])
      .pipe(
        map(([addresses, address]) => {
          return addresses ? addresses.includes(address) : false;
        })
      );
  });

  /**
   * returns a boolean depending on whether the signed in user is represented by another user
   * in a given meeting
   * @param {string} meetingAddress
   * @return {Observable<boolean>}
   */
  getHasGivenAuthority: ((string) => Observable<boolean>) = memoizee((meetingAddress: string) => {
    return combineLatest([
      this.getRepresentedByDictionary(meetingAddress),
      this.ethersService.getSignerAddress()])
      .pipe(
        map(([representedBy, address]) => {
          return representedBy ? Object.keys(representedBy).includes(address) : false;
        })
      );
  });

  /**
   * returns the metadata as a string from a hash of a given meeting
   * @param metaDataHash
   */
  getResolvedMetaDataFromHash(metaDataHash: string): Observable<StorageMetaData> {
    return this.storageService.getJsonData(metaDataHash);
  }

  /**
   * returns if currently meetings are being loaded
   * @return {Observable<boolean>}
   */
  getMeetingsLoading(): Observable<boolean> {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getMeetingState,
          meetingReducer.getIsMeetingsLoading()
        )
      )
    );
  }

  /**
   * removes a representation by calling action
   * @param {string} meeting
   * @param {string} member
   */
  removeRepresentation(meeting: MeetingModel, member: User) {
    this.store.dispatch(meetingActions.RemoveRepresentationAction({meeting, member}));
  }

  /**
   * adds a representative by calling action
   * @param {MeetingModel} meeting
   * @param {string} representee
   * @param {string} representative
   */
  createRepresentation(meeting: MeetingModel, representee: string, representative: string) {
    this.store.dispatch(meetingActions.AddRepresentationAction({
      meeting: meeting,
      representeeAddress: representee,
      representativeAddress: representative
    }));
  }

  /**
   * creates a meeting by dispatching action
   * @param {MeetingModel} meeting
   */
  createMeeting(meeting: MeetingModel) {
    this.store.dispatch(meetingActions.CreateMeetingAction({meeting}));
  }

  /**
   * vote gets deleted
   * @param {MeetingModel} meeting
   */
  deleteMeeting(meeting: MeetingModel) {
    this.store.dispatch(meetingActions.DeleteMeetingAction({meetingAddress: meeting.address}));
  }

  /**
   * updates a meeting by dispatching action
   * @param {MeetingModel} meeting
   */
  updateMeeting(meeting: MeetingModel) {
    this.store.dispatch(meetingActions.UpdateMeetingAction({meeting}));
  }

  /**
   * toggles the visibility of a meeting by dispatching action
   * @param {MeetingModel} meeting
   */
  toggleMeetingVisibility(meeting: MeetingModel) {
    this.store.dispatch(meetingActions.ToggleMeetingVisibilityAction({meeting}));
  }

  /**
   * sorts the votes of a meeting if they have been changed
   * @param {string} meetingAddress
   * @param {string[]} voteAddresses
   */
  sortVotesOfMeeting(meetingAddress: string, voteAddresses: string[]) {
    this.store.dispatch(meetingActions.SortVotesOfMeetingAction({meetingAddress, voteAddresses}));
  }

  /**
   * opens the Registration for a meeting by dispatching action
   * @param {MeetingModel} meeting
   */
  openRegistration(meeting: MeetingModel) {
    this.store.dispatch(meetingActions.OpenRegistrationStageAction({meeting}));
  }

  /**
   * closes the Registration for a meeting by dispatching action
   * @param {MeetingModel} meeting
   */
  closeRegisterStage(meeting: MeetingModel) {
    this.store.dispatch(meetingActions.CloseRegistrationStageAction({meeting}));
  }

  /**
   * opens a Meeting by dispatching action
   * @param {MeetingModel} meeting
   */
  openMeeting(meeting: MeetingModel) {
    this.store.dispatch(meetingActions.OpenMeetingAction({meeting}));
  }

  /**
   * closes a Meeting by dispatching action
   * @param {MeetingModel} meeting
   */
  closeMeeting(meeting: MeetingModel) {
    this.store.dispatch(meetingActions.CloseMeetingAction({meeting}));
  }

  /**
   *
   * @param {MeetingModel} meeting
   */
  joinMeeting(meeting: MeetingModel) {
    this.store.dispatch(meetingActions.JoinMeetingAction({meeting}));
  }

}
