/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {combineLatest, Observable} from 'rxjs';
import {debounceTime, map, shareReplay, switchMap} from 'rxjs/operators';
import {EthersService} from '@core/services/ethers.service';
import {VoteSelectorsService} from '@voting/services/vote-selectors.service';
import {Store} from '@ngrx/store';
import {VoteResult} from '@voting/models/vote.model';
import {MeetingContractService} from '@meeting/services/meeting-contract.service';
import {OrganizationContractService} from '@core/services/organization-contract.service';
import {StorageArchiveReason, StorageVote, StorageVotingOption} from '@core/models/storage.model';
import {CryptoFacade} from '@core/services/crypto.facade';
import {StorageService} from '@core/services/storage.service';
import {deepDistinctUntilChanged} from '@core/utils/pipe.util';
import memoizee from 'memoizee';
import {VoteStage} from '@voting/models/vote-stage.enum';
import {VerifiableBallot} from '@voting/models/ballot-box.model';
import {BigNumber, ethers} from 'ethers';
import {ObjectUtil} from '@core/utils/object.util';
import {VoteCertificate} from '@core/models/signature.model';
import {LocalStorageUtil} from '@core/utils/local-storage.util';
import {Ballot} from '@core/models/ballot-box.model';

/**
 * The service only holds methods that vote services need.
 */
@Injectable({
  providedIn: 'root'
})
export class VoteService {

  constructor(private store: Store<any>,
              private voteSelectors: VoteSelectorsService,
              private ethersService: EthersService,
              private meetingContractService: MeetingContractService,
              private organizationContractService: OrganizationContractService,
              private cryptoFacade: CryptoFacade,
              private storageService: StorageService) {
  }

  /**
   * returns resolved vote options from store
   * @param {string} voteAddress
   * @return {Observable<StorageVotingOption[]>} extends StorageData and may have a value(string)
   */
  getResolvedVoteOptions: ((string) => Observable<StorageVotingOption[]>) = memoizee((voteAddress: string) => {
    return this.voteSelectors.getOptionHashes(voteAddress).pipe(
      switchMap((hashValues: string[]) => {
        return this.storageService.getJsonMultiData(hashValues);
      }),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns own anonymous votes that have been cast
   * @param {string} voteAddress
   * @return {Observable<string[]>} list of own anonymous votes already used
   */
  getAnonymousVotesCast: ((string) => Observable<string[]>) = memoizee((voteAddress: string) => {
    return combineLatest([
      this.voteSelectors.getVerifiableBallotsByVoteAddress(voteAddress),
      this.getResolvedVoteOptions(voteAddress),
      this.cryptoFacade.getSecret(),
      this.voteSelectors.getChairmanPublicKey(voteAddress),
      this.voteSelectors.getRoot(voteAddress),
      this.voteSelectors.getIndex(voteAddress),
      this.getNumberOfOwnVoteRights(voteAddress)
    ]).pipe(
      map((
        [
          verifiableBallots,
          options,
          secret,
          chairmanPublicKey,
          root,
          index,
          voteCount
        ]:
          [
            VerifiableBallot[],
            StorageVotingOption[],
            string,
            string[],
            BigNumber,
            BigNumber,
            number
          ]
      ) => {
        const [ownVotesIndexes] = this.cryptoFacade.getOwnAnonVotes(
          verifiableBallots.map(vBallot => vBallot.ballot),
          secret,
          voteAddress,
          chairmanPublicKey,
          options.length,
          root,
          index,
          voteCount);

        return ownVotesIndexes.map(_index => options[_index].value);
      }),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });
  /**
   * returns own votes that have been cast
   * @param {string} voteAddress
   * @return {Observable<string[]>}
   */
  getNotAnonymousVotesCast: ((string) => Observable<string[]>) = memoizee((voteAddress: string) => {
    return combineLatest([
      this.voteSelectors.getVerifiableBallotsByVoteAddress(voteAddress),
      this.getResolvedVoteOptions(voteAddress),
      this.cryptoFacade.getSecret(),
      this.voteSelectors.getChairmanPublicKey(voteAddress),
      this.ethersService.getSignerAddress()
    ]).pipe(
      debounceTime(15),
      map((
        [
          verifiableBallots,
          options,
          secret,
          chairmanPublicKey,
          address
        ]:
          [
            VerifiableBallot[],
            StorageVotingOption[],
            string,
            string[],
            string
          ]
      ) => {
        const ownVotesIndexes = this.cryptoFacade.getOwnVotes(
          verifiableBallots.map(vBallot => vBallot.ballot),
          secret,
          voteAddress,
          chairmanPublicKey,
          options.length,
          address);

        return ownVotesIndexes.map(index => options[index].value);
      }),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns the number of vote rights of all people that are allowed to vote in a vote
   * @param {string} voteAddress
   * @return {Observable<number>}
   */
  getNumberOfTotalVoteRights: ((string) => Observable<number>) = memoizee((voteAddress: string) => {
    return this.voteSelectors.getLeaves(voteAddress).pipe(
      map(leaves => {
        const count = leaves.filter(leaf => !ObjectUtil.isEmptyHash(leaf)).length;
        return count < 0 ? 0 : count;
      }),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns the amount of total votes cast in a vote
   * @param {string} voteAddress
   * @return {Observable<number>}
   */
  getNumberOfTotalVotesCast: ((string) => Observable<number>) = memoizee((voteAddress: string) => {
    return this.voteSelectors.getVerifiableBallotsByVoteAddress(voteAddress).pipe(
      map((ballots: VerifiableBallot[]) => {
        return ballots ? ballots.length : undefined;
      }),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns number of own vote rights by checking leaves with hash
   * @param {string} voteAddress
   * @return {Observable<number>}
   */
  getNumberOfOwnVoteRights: ((string) => Observable<number>) = memoizee((voteAddress: string) => {
    return combineLatest([
      this.cryptoFacade.getSecretHash(),
      this.voteSelectors.getLeaves(voteAddress),
    ]).pipe(
      map(([hash, leaves]) => {
        return leaves.filter(leaf => BigInt(leaf) == BigInt(hash)).length;
      }),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns the decisions that have been made when voted for a voteAddress
   * @param {string} voteAddress
   * @return {Observable<string[]>}
   */
  getOwnVoteOptions: ((string) => Observable<string[]>) = memoizee((voteAddress: string) => {
    return this.voteSelectors.getIsAnonymous(voteAddress).pipe(
      switchMap(isAnonymous => {
        let votes: Observable<string[]>;
        if (isAnonymous) {
          votes = this.getAnonymousVotesCast(voteAddress);
        } else {
          votes = this.getNotAnonymousVotesCast(voteAddress);
        }
        return votes;
      }),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns list of voters and number of their votes
   * @param {string} voteAddress
   * @return {Observable<VoteResult[]>} may contain names and number of votes for that person
   */
  getNotVerifiedResult: ((string) => Observable<VoteResult[]>) = memoizee((voteAddress: string) => {
    return combineLatest([
      this.voteSelectors.getVerifiableBallotsByVoteAddress(voteAddress),
      this.voteSelectors.getChairmanPrivateKey(voteAddress),
      this.getResolvedVoteOptions(voteAddress)
    ]).pipe(
      map(([
             verifiableBallots,
             chairPrivateKey,
             options
           ]: [
        VerifiableBallot[],
        BigNumber,
        StorageVotingOption[]
      ]) => {
        if (BigInt(chairPrivateKey) == BigInt(0)) {
          return [];
        }
        const results = this.cryptoFacade.countVote(
          verifiableBallots.map(vBallot => vBallot.ballot),
          chairPrivateKey._hex,
          options.length
        );

        const counts = {};
        for (const num of results) {
          counts[num] = counts[num] ? counts[num] + 1 : 1;
        }

        return options.map((option, index) => {
          return {
            name: option.value,
            value: (counts[index] > 0) ? counts[index] : 0
          };
        });
      }),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns the anonymous accounts of a signed in user
   * @param {string} voteAddress
   * @return {Observable<string[]>}
   */
  getOwnAnonymousAccounts: ((string) => Observable<string[]>) = memoizee((voteAddress: string) => {
    return combineLatest([
      this.cryptoFacade.getSecret(),
      this.voteSelectors.getRoot(voteAddress),
      this.voteSelectors.getIndex(voteAddress),
      this.getNumberOfOwnVoteRights(voteAddress),
      this.voteSelectors.getVoteStage(voteAddress)
    ]).pipe(
      debounceTime(15),
      map(([secret, root, index, numberOfVotingRights, stage]) => {
        if (stage < VoteStage.OPENED) {
          return [];
        }
        const result = [];
        for (let i = 0; i < numberOfVotingRights; i++) {
          result.push(this.cryptoFacade.getAnonAddress(secret, root, index, i));
        }
        return result;
      }),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });
  /**
   * returns archive reason from storage
   * @param {string} voteAddress
   * @return {Observable<StorageArchiveReason>} contains a string
   */
  getArchiveReason: ((string) => Observable<StorageArchiveReason>) = memoizee((voteAddress: string) => {
    return this.voteSelectors.getReasonHash(voteAddress).pipe(
      switchMap(hash => {
        return this.storageService.getJsonData(hash);
      }),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns archive reason from storage
   */
  resolveVoteDecisionsFromCertificates(voteAddress: string, ballots: Ballot[], voteOptionsLength: number): Observable<number[]> {
    return this.voteSelectors.getChairmanPrivateKey(voteAddress).pipe(
      map(key => this.cryptoFacade.countVote(ballots, key._hex, voteOptionsLength))
    );
  }

  /**
   * returns resolved metadata from hash from storage
   * @param {string} metaDataHash
   * @return {Observable<StorageVote>} extends StorageData and contains filename, description and title
   */
  getResolvedMetaDataFromHash(metaDataHash: string): Observable<StorageVote> {
    return this.storageService.getJsonData(metaDataHash);
  }

  /**
   * returns an array of VoteCertificates for an array of signers for one vote
   * @param {string[]} signers (for an anonymous vote, every casted vote has an unique signer)
   * @param {string} voteAddress
   */
  getVerifiedVoteCertificates(signers: string[], voteAddress: string): VoteCertificate[] {
    let result = [];
    signers.forEach((signer: string) => {
      const certs = LocalStorageUtil.getCertificates(voteAddress, signer)
        .map((cert: VoteCertificate) => {
          const ballot = JSON.parse(cert.certificate.message);
          // 1. Check if voteAddress is the same
          const validBallotAddress = ballot.voteAddress.toLowerCase() === voteAddress.toLowerCase();

          // 2. Check Signature of Ballotbox
          const resolvedBallotBoxSigner = ethers.utils.verifyMessage(
            cert.certificate.message,
            cert.certificate.signature
          );
          const validBaseSignature = resolvedBallotBoxSigner.toLowerCase() === cert.ballotBox.address.toLowerCase();

          // 3. Check VoteDecision Signature
          const resolvedDecisionSigner = ethers.utils.verifyMessage(
            ballot.signedDecision.decision,
            ballot.signedDecision.decisionSignature
          );
          const validDecisionSignature = resolvedDecisionSigner.toLowerCase() === signer.toLowerCase();

          cert.isValid = validBaseSignature && validBallotAddress && validDecisionSignature;
          return cert;
        });
      result = result.concat(certs);
    });
    return result;
  }
}
