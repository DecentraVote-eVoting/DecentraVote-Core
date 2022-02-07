/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {createSelector, select, Store} from '@ngrx/store';
import * as fromRoot from '@app/app.store';
import {Observable} from 'rxjs';
import * as fromVote from '@voting/+state/vote.reducer';
import * as fromBallotBox from '@voting/+state/ballot-box.reducer';
import {VoteModel} from '@voting/models/vote.model';
import {VoteStage} from '@voting/models/vote-stage.enum';
import {BigNumber} from 'ethers';
import {Injectable} from '@angular/core';
import {filter, map, shareReplay} from 'rxjs/operators';
import memoizee from 'memoizee';
import {VerifiableBallot} from '@voting/models/ballot-box.model';
import {deepDistinctUntilChanged} from '@core/utils/pipe.util';

@Injectable({
  providedIn: 'root'
})
export class VoteSelectorsService {

  constructor(private store: Store<fromRoot.State>) {
  }

  /**
   * returns vote models from store
   * @param {string} voteAddress
   * @return {Observable<VoteModel[]>}
   */
  getVoteModels: ((string) => Observable<VoteModel[]>) = memoizee((meetingAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.getVotesByMeeting(meetingAddress)
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  getVote: ((string) => Observable<VoteModel>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(createSelector(
        fromRoot.getVoteState, fromVote.getVoteByAddress(voteAddress))
      ),
      filter(val => !!val),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns parent meeting address from store
   * @param {string} voteAddress
   * @return {Observable<string>}
   */
  getParentMeetingAddress: ((string) => Observable<string>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.getParentGeneralMeeting(voteAddress)
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns metadata hash from store
   * @param {string} voteAddress
   * @return {Observable<string>}
   */
  getMetaDataHash: ((string) => Observable<string>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.getMetaDataHash(voteAddress)
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns option hashes from store
   * @param {string} voteAddress
   * @return {Observable<string[]>}
   */
  getOptionHashes: ((string) => Observable<string[]>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.getOptionHashes(voteAddress)
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns reason hash from store
   * @param {string} voteAddress
   * @return {Observable<string>}
   */
  getReasonHash: ((string) => Observable<string>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.getReasonHash(voteAddress)
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns if voter is anonymous
   * @param {string} voteAddress
   * @return {Observable<boolean>}
   */
  getIsAnonymous: ((string) => Observable<boolean>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.getIsAnonymous(voteAddress)
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns vote stage from store
   * @param {string} voteAddress
   * @return {Observable<VoteStage>} is an enum
   */
  getVoteStage: ((string) => Observable<VoteStage>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.getStage(voteAddress)
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns root from store
   * @param {string} voteAddress
   * @return {Observable<BigNumber>}
   */
  getRoot: ((string) => Observable<BigNumber>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.getRoot(voteAddress)
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns index from store
   * @param {string} voteAddress
   * @return {Observable<BigNumber>}
   */
  getIndex: ((string) => Observable<BigNumber>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.getIndex(voteAddress)
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns chairman public key from store
   * @param {string} voteAddress
   * @return {Observable<string[]>}
   */
  getChairmanPublicKey: ((string) => Observable<string[]>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.getChairmanPublicKey(voteAddress)
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns chairman private key from store
   * @param {string} voteAddress
   * @return {Observable<BigNumber>}
   */
  getChairmanPrivateKey: ((string) => Observable<BigNumber>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.getChairmanPrivateKey(voteAddress)
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  getVerifiableBallotsByVoteAddress: ((string) => Observable<VerifiableBallot[]>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getBallotBoxState,
          fromBallotBox.getVerifiableBallotsByVoteAddress(voteAddress)
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns list of excluded members from store
   * @param {string} voteAddress
   * @return {Observable<string[]>}
   */
  getExcludedList: ((string) => Observable<string[]>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.getExcludedList(voteAddress)
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns leaves from store
   * @param {string} voteAddress
   * @return {Observable<string[]>}
   */
  getLeaves: ((string) => Observable<BigNumber[]>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.getLeavesByAddress(voteAddress)
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns vote archive reason from store
   * @param {string} voteAddress
   * @return {Observable<boolean>}
   */
  getVoteArchiveState: ((string) => Observable<boolean>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.isVotingArchiveStateChanged(voteAddress)
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns vote loading state from store
   * @param {string} voteAddress
   * @return {Observable<boolean>}
   */
  getVoteLoadingState: ((string) => Observable<boolean>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.isVoteLoadingStateChanged(voteAddress)
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns attachment hash from store
   * @param {string} voteAddress
   * @return {Observable<string>}
   */
  getAttachmentHash: ((string) => Observable<string>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.getAttachmentHash(voteAddress)
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns  from store
   * @param {string} voteAddress
   * @return {Observable<boolean>}
   */
  getIsCastVoteLoading: ((string) => Observable<boolean>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.isCastVoteLoading(voteAddress)
        )
      ),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  getIsProcessingVotes: ((string) => Observable<boolean>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.isProcessingVote(voteAddress)
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  getIsVerifyingVotes: ((string) => Observable<boolean>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.isVerifyingVotes(voteAddress)
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  getMemberExclusionLoadingState: ((string) => Observable<{ address: string, toBeExcluded: boolean }[]>) = memoizee((voteAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.getMemberExclusionLoadingState(voteAddress)
        )
      ),
      map(val => val ? val : []),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns if vote is loading from store
   * @return {Observable<boolean>}
   */
  getIsVoteLoading(): Observable<boolean> {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.isVoteLoading
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  }

  /**
   * returns all vote models from store
   * @return {Observable<VoteModel[]>} extends Vote-Dto and contains vote address
   */
  getAllVoteModels(): Observable<VoteModel[]> {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getVoteState,
          fromVote.selectAllVotes
        )
      ),
      filter(val => val !== undefined),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  }
}
