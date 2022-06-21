/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {combineLatest, Observable, of, zip} from 'rxjs';
import {Store} from '@ngrx/store';
import * as fromRoot from '@app/app.store';
import * as voteActions from '@voting/+state/vote.actions';
import {
  CreateVoteModel,
  ExportVoteResult,
  UserResult,
  VoteCardModel,
  VoteDetailModel,
  VoteModel,
  VoteResult
} from '@voting/models/vote.model';
import {StorageArchiveReason, StorageVote, StorageVotingOption} from '@core/models/storage.model';
import {CryptoFacade} from '@core/services/crypto.facade';
import {debounceTime, map, mergeMap, shareReplay, switchMap} from 'rxjs/operators';
import {EthersService} from '@core/services/ethers.service';
import {MeetingContractService} from '@meeting/services/meeting-contract.service';
import {OrganizationContractService} from '@core/services/organization-contract.service';
import {BigNumber} from 'ethers';
import {VoteStage} from '@voting/models/vote-stage.enum';
import {CryptographyService} from '@core/services/cryptography.service';
import {StorageService} from '@core/services/storage.service';
import {MeetingFacade} from '@meeting/services/meeting.facade';
import {VoteSelectorsService} from '@voting/services/vote-selectors.service';
import {VoteService} from '@voting/services/vote.service';
import {User, VotingMember} from '@app/user/models/user.model';
import {VotingContractService} from '@voting/services/voting-contract.service';
import {deepDistinctUntilChanged} from '@core/utils/pipe.util';
import memoizee from 'memoizee';
import {UserFacade} from '@app/user/services/user.facade';
import {VerifiableBallot} from '@voting/models/ballot-box.model';

/**
 * The facade only holds methods that are (not exclusively) used by components.
 */
@Injectable({
  providedIn: 'root'
})
export class VoteFacade {

  constructor(
    private store: Store<fromRoot.State>,
    private selectors: VoteSelectorsService,
    private cryptoFacade: CryptoFacade,
    private cryptoService: CryptographyService,
    private ethersService: EthersService,
    private meetingContractService: MeetingContractService,
    private votingContractService: VotingContractService,
    private organizationContractService: OrganizationContractService,
    private storageService: StorageService,
    private meetingFacade: MeetingFacade,
    private voteService: VoteService,
    private memberFacade: UserFacade
  ) {
  }

  getIsProcessingVotes: ((string) => Observable<boolean>) = memoizee((voteAddress: string) => {
    return this.selectors.getIsProcessingVotes(voteAddress);
  });

  getIsVerifyingVotes: ((string) => Observable<boolean>) = memoizee((voteAddress: string) => {
    return this.selectors.getIsVerifyingVotes(voteAddress);
  });

  getVerifiableBallotsByVoteAddress: ((string) => Observable<VerifiableBallot[]>) = memoizee((voteAddress: string) => {
    return this.selectors.getVerifiableBallotsByVoteAddress(voteAddress);
  });

  getIsAnonymousByVoteAddress: ((string) => Observable<boolean>) = memoizee((voteAddress: string) => {
    return this.selectors.getIsAnonymous(voteAddress);
  });

  /**
   * returns the Loading State of a vote
   * @param {string}voteAddress
   * @return {Observable<boolean>}
   */
  getVoteLoadingState: ((string) => Observable<boolean>) = memoizee((voteAddress: string) => {
    return this.selectors.getVoteLoadingState(voteAddress);
  });

  /**
   * returns the Archive State of a vote
   * @param {string}voteAddress
   * @return {Observable<boolean>}
   */
  getVoteArchiveState: ((string) => Observable<boolean>) = memoizee((voteAddress: string) => {
    return this.selectors.getVoteArchiveState(voteAddress);
  });

  /**
   * returns if the state getIsCastVoteLoading has changed for a specific vote
   * @param {string}voteAddress
   * @return {Observable<boolean>}
   */
  getCastVoteLoading: ((string) => Observable<boolean>) = memoizee((voteAddress: string) => {
    return this.selectors.getIsCastVoteLoading(voteAddress);
  });


  /**
   * returns the Vote for a given address
   * @param {string} voteAddress
   * @return {Observable<voteModel>} extends Vote-Dto and contains vote address
   */
  getVoteFromStore: ((string) => Observable<VoteModel>) = memoizee((voteAddress: string) => {
    return this.selectors.getVote(voteAddress);
  });


  /**
   * returns a full VoteCardModel for the given address
   * @param{string} voteAddress
   * @return {Observable<VoteCardModel>} contains all information regarding votes and their amount as well as vote information
   */
  getVoteCardModelByAddress: ((string) => Observable<VoteCardModel>) = memoizee((voteAddress: string) => {
    return this.selectors.getMetaDataHash(voteAddress).pipe(
      mergeMap(metaDataHash => {
        return combineLatest([
          this.selectors.getParentMeetingAddress(voteAddress),
          this.voteService.getResolvedMetaDataFromHash(metaDataHash),
          this.selectors.getIsAnonymous(voteAddress),
          this.selectors.getVoteStage(voteAddress),
          this.voteService.getNumberOfTotalVoteRights(voteAddress),
          this.voteService.getNumberOfTotalVotesCast(voteAddress),
          this.voteService.getNumberOfOwnVoteRights(voteAddress),
          this.voteService.getOwnVoteOptions(voteAddress)
        ]);
      }),
      map(([
             meetingAddress,
             metaData,
             isAnonymous,
             voteStage,
             numberOfTotalVoteRights,
             numberOfTotalVotesCast,
             numberOfOwnVoteRights,
             ownVoteOptions,
           ]: [
        string,
        StorageVote,
        boolean,
        VoteStage,
        number,
        number,
        number,
        string[]
      ]) => {
        return {
          address: voteAddress,
          meetingAddress: meetingAddress,
          title: metaData.title,
          description: metaData.description,
          isAnonymous: isAnonymous,
          stage: voteStage,
          numberOfTotalVoteRights: numberOfTotalVoteRights,
          numberOfOwnVoteRights: numberOfOwnVoteRights,
          numberOfTotalVotesCast: numberOfTotalVotesCast,
          numberOfOwnVotesCast: ownVoteOptions.length,
          ownVoteOptions: ownVoteOptions
        } as VoteCardModel;
      }),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * @arams {string} voteAddress
   * @return {Observable<VoteStage>}
   */
  getVoteStage: ((string) => Observable<VoteStage>) = memoizee((voteAddress: string) => {
    return this.selectors.getVoteStage(voteAddress);
  });

  /**
   * returns a VoteDetailModel for a given address
   * @param {string} voteAddress
   * @return {Observable<VoteDetailModel>} extends VoteCardModel, contains registration status and additional vote information
   */
  getVoteDetailModelByAddress: ((address: string) => Observable<VoteDetailModel>) = memoizee((voteAddress: string) => {
    return this.getVoteCardModelByAddress(voteAddress).pipe(
      switchMap((voteCardModel: VoteCardModel) => {
        return combineLatest([
          this.getVoteOptions(voteAddress),
          this.voteService.getNotVerifiedResult(voteAddress),
          this.getResolvedMetaDataByAddress(voteAddress),
          this.getAttachment(voteAddress),
          this.voteService.getArchiveReason(voteAddress)
        ]).pipe(
          switchMap(([
                       voteOptions,
                       result,
                       metaData,
                       attachment,
                       reason
                     ]: [StorageVotingOption[], VoteResult[], StorageVote, Blob, StorageArchiveReason]) => {
            if (!voteCardModel.isAnonymous) {
              return of({
                ...voteCardModel,
                result: result,
                attachment: attachment ? new File([attachment], metaData.filename) : null,
                filename: metaData.filename,
                archiveReason: reason.reason,
                voteOptions: voteOptions
              });
            }
            return this.voteService.getOwnAnonymousAccounts(voteAddress).pipe(
              map((anon: string[]) => {
                return {
                  ...voteCardModel,
                  result: result,
                  anonymousAccountsRegistered: anon,
                  attachment: attachment ? new File([attachment], metaData.filename) : null,
                  filename: metaData.filename,
                  archiveReason: reason.reason,
                  voteOptions: voteOptions
                };
              })
            );
          }),
          deepDistinctUntilChanged(),
          shareReplay(1)
        );
      }),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns metadata for vote
   * @param {string} voteAddress
   * @return {Observable<StorageVote>} extends StorageData and contains filename, description and title
   */
  getResolvedMetaDataByAddress: ((string) => Observable<StorageVote>) = memoizee((voteAddress: string) => {
    return this.selectors.getMetaDataHash(voteAddress).pipe(
      switchMap(hash => {
        return this.voteService.getResolvedMetaDataFromHash(hash);
      }),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns attachment for vote
   * @param {string} voteAddress
   * @return {Observable<Blob>} a big binary data object
   */
  getAttachment: ((string) => Observable<Blob>) = memoizee((voteAddress: string) => {
    return this.selectors.getAttachmentHash(voteAddress).pipe(
      switchMap((hash: string) => {
        return this.storageService.getBlobData(hash);
      }),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns list of members that are excluded from voting
   * @param {string} voteAddress
   * @return {Observable<VotingMember[]>} contains member representative and vote count as well as potential vote count
   */
  getExcludedFromVoteList: ((string) => Observable<User[]>) = memoizee((voteAddress: string) => {
    return this.selectors.getExcludedList(voteAddress).pipe(
      switchMap(addresses => {
        if (addresses.length === 0) {
          return of([]);
        } else {
          return zip(...addresses.map(address => this.memberFacade.getUserByAddress(address)));
        }
      }),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns list of members that are not excluded from vote (can be more member than registered to this meeting)
   * @param {string} voteAddress
   * @return {Observable<VotingMember[]>} contains member representative and vote count as well as potential vote count
   */
  getNonExcludedMember: ((string) => Observable<User[]>) = memoizee((voteAddress: string) => {
    return combineLatest([
      this.memberFacade.getMembers(),
      this.selectors.getExcludedList(voteAddress)
    ]).pipe(
      switchMap(([members, excludedAddresses]) => {
        if (members && members.length > 0) {
          return of(members.filter(m => !excludedAddresses.includes(m.address)));
        } else {
          return of([]);
        }
      }),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * @param {VoteDetailModel} vote
   * @return {Observable<ExportVoteResult>} contains vote description, title, attachment, options and results
   */
  getResultsByVoteDecisionAddress: ((voteAddress: string) => Observable<UserResult[]>) = memoizee((voteAddress: string) => {
    return combineLatest([
      this.getUsersThatVotedByVoteAddress(voteAddress),
      this.selectors.getVerifiableBallotsByVoteAddress(voteAddress),
      this.selectors.getChairmanPrivateKey(voteAddress),
      this.voteService.getResolvedVoteOptions(voteAddress),
    ]).pipe(
      debounceTime(15),
      map(([
             usersThatVoted,
             verifiableBallots,
             chairPrivateKey,
             options]: [
        User[],
        VerifiableBallot[],
        BigNumber,
        StorageVotingOption[],
      ]) => {
        const uniqueUserResults: { [key: string]: UserResult } = {};

        const voteCount = this.cryptoFacade.countVote(
          verifiableBallots.map(vBallot => vBallot.ballot),
          chairPrivateKey._hex, options.length);

        for (let i = 0; i < voteCount.length; i++) {
          const user = usersThatVoted[i];
          if (uniqueUserResults[user.address]) {
            uniqueUserResults[user.address].options.push(options[voteCount[i]].value);
          } else {
            uniqueUserResults[user.address] = {
              ...user.resolvedClaim,
              ethAddress: user.address,
              options: [options[voteCount[i]].value],
            };
          }
        }

        const userResults: UserResult[] = [];
        Object.keys(uniqueUserResults).forEach(key => {
          userResults.push(uniqueUserResults[key]);
        });

        return userResults;
      }),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns users for decision addresses
   * @param {string} voteAddress
   * @return {Observable<User[]>} contains personal information for a member such as name
   */
  getUsersThatVotedByVoteAddress: ((string) => Observable<User[]>) = memoizee((voteAddress: string) => {
    return this.selectors.getVerifiableBallotsByVoteAddress(voteAddress).pipe(
      switchMap(vBallots => {
        if (vBallots.length === 0) {
          return of([]);
        }
        return zip(...vBallots.map(vBallot => {
          return this.memberFacade.getUserByAddress(vBallot.signerAddress);
        }));

      }),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns if all votes that are open were counted
   * @param {string} voteAddress
   * @return {Observable<boolean>} allOpenVotesAreCounted
   */
  allVotesAreArchivedOrCounted: ((meetingAddress: string) => Observable<boolean>) = memoizee((meetingAddress: string) => {
    return this.selectors.getVoteModels(meetingAddress).pipe(
      switchMap((voteModels: VoteModel[]) => {
        if (voteModels.length === 0) {
          return of(true);
        }
        return of(voteModels.every(voteModel => {
          return voteModel.stage === VoteStage.COUNTED || voteModel.stage === VoteStage.ARCHIVED;
        }));
      }),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns all leaves of a given vote
   * @return {Observable<string[]>}
   */
  getLeaves: ((voteAddress: string) => Observable<BigNumber[]>) = memoizee((voteAddress: string) => {
    return this.selectors.getLeaves(voteAddress);
  });

  /**
   * returns all registered member from a meeting that did not register in time for a vote
   * @return {Observable<string[]>}
   */
  getTooLateRegisteredMemberForVote: ((meetingAddress: string, voteAddress: string) => Observable<User[]>)
    = memoizee((meetingAddress: string, voteAddress: string) => {
    return combineLatest([
      this.meetingFacade.getMembersWithVotingCount(meetingAddress),
      this.getExcludedFromVoteList(voteAddress),
      this.getResultsByVoteDecisionAddress(voteAddress),
    ]).pipe(
      map(([memberWithVoteCount, excluded, voters]: [User[], User[], UserResult[]]) => {
        return memberWithVoteCount
          .filter(member => !excluded.map(val => val.address).includes(member.address))
          .filter(member => !voters.map(val => val.ethAddress).includes(member.address));
      })
    );
  });

  /**
   * returns all vote options
   * @param {string} voteAddress
   * @return {Observable<StorageVotingOption[]>} extends StorageData and may have a value(string)
   */
  getVoteOptions: ((string) => Observable<StorageVotingOption[]>) = memoizee((voteAddress: string) => {
    return this.voteService.getResolvedVoteOptions(voteAddress);
  });


  getNotVerifiedResult(voteAddress: string): Observable<VoteResult[]> {
    return this.voteService.getNotVerifiedResult(voteAddress);
  }

  /**
   * creates a vote from parameters
   * @param {CreateVoteModel} voteModel
   * @param {string[]} voteOptions
   * @param {File} attachment
   * @param {boolean} edit
   */
  createVote(voteModel: CreateVoteModel, voteOptions: string[], attachment: File, edit: boolean) {
    const storageData: StorageVote = {
      title: voteModel.title,
      description: voteModel.description,
      filename: (attachment && attachment.name) || ''
    };
    voteModel.voteOptions = voteOptions.map(v => {
      return {value: v};
    });

    if (edit) {
      this.store.dispatch(voteActions.EditVoteAction({
        voteModel: voteModel,
        metaData: storageData,
        attachment: attachment
      }));
    } else {
      this.store.dispatch(voteActions.CreateVoteAction({
        voteModel: voteModel,
        metaData: storageData,
        attachment: attachment
      }));
    }
  }

  /**
   * excludes a member from vote
   * @param {string} voteAddress
   * @param {string[]} addressesToBlock
   */
  excludeFromVote(voteAddress: string, addressesToBlock: string[]) {
    this.store.dispatch(voteActions.ExcludeFromVoteAction({
      voteAddress: voteAddress,
      addressesToBlock: addressesToBlock
    }));
  }

  /**
   * returns if vote is Loading
   * @return {Observable<boolean>}
   */
  getVoteLoading(): Observable<boolean> {
    return this.selectors.getIsVoteLoading();
  }

  /**
   * vote gets cast for a specific meeting, a specific vote and the option that was chosen
   * @param  {string[]} voteOptions
   * @param startIndex
   * @param {string} votingAddress
   */
  vote(voteOptions: string[], startIndex: number, votingAddress: string) {
    this.store.dispatch(voteActions.CastVoteAction({
        voteOptions: voteOptions,
        voteAddress: votingAddress,
        startIndex: startIndex
      })
    );
  }

  /**
   * vote gets set to open Vote Stage
   * @param {VoteCardModel} voteModel
   */
  openVoting(voteModel: VoteCardModel) {
    this.store.dispatch(voteActions.ChangeStageAction({voteModel: voteModel, stage: VoteStage.OPENED}));
  }

  /**
   * vote gets set to close Vote Stage
   * @param {VoteCardModel} voteModel
   */
  closeVote(voteModel: VoteCardModel) {
    this.store.dispatch(voteActions.ChangeStageAction({voteModel: voteModel, stage: VoteStage.CLOSED}));
  }

  /**
   * vote gets set to counted Vote Stage
   * @param {VoteCardModel} voteModel
   */
  finishVote(voteModel: VoteCardModel) {
    this.store.dispatch(voteActions.ChangeStageAction({voteModel: voteModel, stage: VoteStage.COUNTED}));
  }

  /**
   * vote gets set to cancelled Stage and stores archive reason
   * @param {VoteCardModel} voteModel
   * @param {string} reason
   */
  archiveVote(voteModel: VoteCardModel, reason: string) {
    const storageReason: StorageArchiveReason = {reason};
    this.store.dispatch(voteActions.ChangeStageAction({
      voteModel: voteModel,
      stage: VoteStage.ARCHIVED,
      reason: storageReason
    }));
  }

  /**
   * vote gets deleted
   * @param {VoteCardModel} voteModel
   */
  deleteVote(voteModel: VoteCardModel) {
    this.store.dispatch(voteActions.DeleteVoteAction({
      meetingAddress: voteModel.meetingAddress,
      voteAddress: voteModel.address,
    }));
  }

  /**
   * get root from store
   * @param {string} voteAddress
   * */
  getRoot(voteAddress: string): Observable<BigNumber> {
    return this.selectors.getRoot(voteAddress);
  }

  getMemberExclusionLoadingState(voteAddress: string): Observable<{ address: string, toBeExcluded: boolean }[]> {
    return this.selectors.getMemberExclusionLoadingState(voteAddress);
  }
}
