/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Observable, of} from 'rxjs';
import {select, Store} from '@ngrx/store';
import * as fromCore from '../+state/core.reducer';
import {MeetingState} from '@meeting/+state/meeting.reducer';
import * as core from '../+state/core.actions';
import {Injectable} from '@angular/core';
import {filter, map, switchMap} from 'rxjs/operators';
import {CryptographyService} from './cryptography.service';
import {EthersService} from '@core/services/ethers.service';
import {BigNumber, Wallet} from 'ethers';
import {NonceManager} from '@ethersproject/experimental';
import {Ballot} from '@core/models/ballot-box.model';
import {LoggingUtil} from '@core/utils/logging.util';

@Injectable({
  providedIn: 'root'
})
export class CryptoFacade {

  private secret$: Observable<string> = this.store.pipe(select(fromCore.getSecret));
  private AskedTime = null;

  constructor(private store: Store<MeetingState>,
              private cryptoService: CryptographyService,
              private ethersService: EthersService) {
  }

  /**
   * resets secret
   */
  resetSecret() {
    this.AskedTime = null;
    this.store.dispatch(core.SetSecretAction({secret: null}));
  }

  /**
   * returns secret, encrypted bytes that are converted to hex
   * @return {Observable<string>}
   */
  getSecret(): Observable<string> {
    return this.secret$.pipe(
      switchMap((secret) => {
        if (secret === null) {
          if (this.AskedTime !== null && (this.AskedTime + 10) > (Math.floor(Date.now() / 1000))) {
            return this.secret$.pipe(filter(secret => secret !== null));
          }
          this.AskedTime = Math.floor(Date.now() / 1000);
          return this.cryptoService.generateSecret().pipe(
            switchMap((secret) => {
              this.store.dispatch(core.SetSecretAction({secret}));
              return of(secret);
            })
          );
        } else {
          return of(secret);
        }
      })
    );
  }

  /**
   * returns secret hash
   * @return {Observable<number>}
   */
  getSecretHash(): Observable<number> {
    return this.getSecret().pipe(map(secret => this.cryptoService.generateSercretHash(secret)));
  }

  /**
   * returns encrypted decisions and public keys of a vote as Ballots
   * @param {string} memberAddress
   * @param {string} secret, encrypted bytes that are converted to hex
   * @param {number[]} decisions
   * @param {string} voteAddress
   * @param {string[]} chairmanPublicKey, uint[2]
   * @return {Ballot[]} ballot models containing the decision hashes and public keys
   */
  createBallots(memberAddress: string, secret: string, decisions: number[], voteAddress: string, chairmanPublicKey: string[]): Ballot[] {
    return decisions.map(decision => this.createBallot(memberAddress, secret, decision, voteAddress, chairmanPublicKey));
  }

  /**
   * returns encrypted decision and public key of a vote as Ballot
   * @param {string} memberAddress
   * @param {string} secret, encrypted bytes that are converted to hex
   * @param {number} decision
   * @param {string} voteAddress
   * @param {string[]} chairmanPublicKey, uint[2]
   * @return {Ballot} ballot model containing the decision hashes and public keys
   */
  createBallot(memberAddress: string, secret: string, decision: number, voteAddress: string, chairmanPublicKey: string[]): Ballot {
    let chairmanPublicKeyBigI = chairmanPublicKey.map(val => BigInt(val));
    chairmanPublicKeyBigI = this.cryptoService.unaffinePublicKey(chairmanPublicKeyBigI);
    const [privateKey, publicKey] = this.getVoteKeyPair(memberAddress + secret + voteAddress);
    return <Ballot>{
      decisionHash: this.cryptoService.generateVote(privateKey, chairmanPublicKeyBigI, decision).toString(),
      publicKey: this.cryptoService.affinePublicKey(publicKey).map(pk => pk.toString())
    };
  }

  /**
   * returns Key Pair(private and public key) of a vote
   * @param {string} value
   * @return {[bigint, bigint[]]}
   */
  getVoteKeyPair(value: string): [bigint, bigint[]] {
    const privateKey = BigInt(this.cryptoService.generateDeterministicPrivateKey(value));
    const publicKey: bigint[] = this.cryptoService.privateKeyToPublicKey(privateKey);
    return [privateKey, publicKey];
  }

  /**
   * returns Key Pair(private and affine public key) of vote
   * @param {string} value
   * @return {[bigint, bigint[]]}
   */
  getVoteKeyPairAffine(value: string): [bigint, bigint[]] {
    const [privateKey, publicKey] = this.getVoteKeyPair(value);
    return [privateKey, this.cryptoService.affinePublicKey(publicKey)];
  }

  /**
   * returns the address of the signer
   */
  getOpenAddress(): string {
    return (this.ethersService.signer.signer as Wallet).address;
  }

  /**
   * returns a unique anonymous address for a single vote right
   * @param {string} secret, encrypted bytes that are converted to hex
   * @param {BigNumber} root, originally unit
   * @param {BigNumber} index, originally unit
   * @param {number} id
   * @return {string}
   */
  getAnonAddress(secret: string, root: BigNumber, index: BigNumber, id: number): string {
    const privateKey = this.cryptoService.generateDeterministicPrivateKey('0x' + index + root + secret + id);
    const wallet: Wallet = new Wallet(privateKey);
    this.ethersService.addAnonymousSigner(new NonceManager(wallet));
    return wallet.address;
  }

  /**
   * returns own votes for a vote
   * @param {Ballot[]} ballots
   * @param {string} secret, encrypted bytes that are converted to hex
   * @param {string} voteAddress
   * @param {string[]} chairmanPublicKey, unit[2]
   * @param {number} optionLength, option hashes are byte32[]
   * @param {null} memberAddress
   * @return {number[]}
   */
  getOwnVotes(
    ballots: Ballot[],
    secret: string,
    voteAddress: string,
    chairmanPublicKey: string[],
    optionLength: number,
    memberAddress = null
  ): number[] {
    const decisionKeys = ballots.map(ballot => ballot.publicKey);
    const decisionHashes = ballots.map(ballot => ballot.decisionHash);

    if (decisionHashes.length == 0 || decisionHashes.length !== decisionKeys.length) {
      return [];
    }
    if (memberAddress === null) {
      memberAddress = (this.ethersService.signer.signer as Wallet).address;
    }
    let chairmanPublicKeyBigI = chairmanPublicKey.map(val => BigInt(val));
    chairmanPublicKeyBigI = this.cryptoService.unaffinePublicKey(chairmanPublicKeyBigI);
    const [privateKey, publicKey] = this.getVoteKeyPair(memberAddress + secret + voteAddress);
    const publicKeyAffine = this.cryptoService.affinePublicKey(publicKey).map(val => val.toString());
    const ids = [];
    for (let i = 0; i < decisionKeys.length; i++) {
      if ((decisionKeys[i][0] == publicKeyAffine[0]) && (decisionKeys[i][1] == publicKeyAffine[1])) {
        ids.push(i);
      }
    }
    const decisions = [];
    for (let i = 0; i < ids.length; i++) {
      for (let j = 0; j < optionLength; j++) {
        const val = this.cryptoService.generateVote(privateKey, chairmanPublicKeyBigI, j);
        if (val === BigInt(decisionHashes[ids[i]])) {
          decisions.push(j);
          break;
        }
      }
    }
    return decisions;
  }

  /**
   * returns own anonymous votes for vote
   * @param {Ballot[]} ballots
   * @param {string} secret, encrypted bytes that are converted to hex
   * @param {string} voteAddress
   * @param {string[]} chairmanPublicKey, unit[2]
   * @param {number} optionLength, option hashes are byte32[]
   * @param {BigNumber} root, originally unit
   * @param {BigNumber} index,originally unit
   * @param {number} participantVotesCount
   * @return {[number[], string[]]}
   */
  getOwnAnonVotes(ballots: Ballot[], secret: string, voteAddress: string, chairmanPublicKey: string[], optionLength: number, root: BigNumber, index: BigNumber, participantVotesCount: number): [number[], string[]] {
    const decisions = [];
    const anonymousAccountsAlreadyUsed = [];
    for (let i = 0; i < participantVotesCount; i++) {
      const address = this.getAnonAddress(secret, root, index, i);
      const decisionsForAddress = this.getOwnVotes(ballots, secret, voteAddress, chairmanPublicKey, optionLength, address);
      decisions.push(...decisionsForAddress);
      if (decisionsForAddress.length > 0) {
        anonymousAccountsAlreadyUsed.push(address);
      }
    }
    return [decisions, anonymousAccountsAlreadyUsed];
  };

  /**
   * returns an array with the decisions of a vote
   * @param {Ballot[]} ballots
   * @param {string} privateKey
   * @param {number} length
   * @return {number[]}
   */
  countVote(ballots: Ballot[], privateKey: string, length: number): number[] {
    const decisions = [];
    const privateKeyBigI = BigInt(privateKey);
    const decisionKeys = ballots.map(ballot => ballot.publicKey);
    const decisionHashes = ballots.map(ballot => BigInt(ballot.decisionHash));
    const decisionPublicKeysBigI = decisionKeys.map(elem => this.cryptoService.unaffinePublicKey(elem.map(val => BigInt(val))));

    for (let i = 0; i < decisionHashes.length; i++) {
      let baseVote = this.cryptoService.getBaseVote(privateKeyBigI, decisionPublicKeysBigI[i]);
      for (let j = 0; j < length; j++) {
        if (baseVote === decisionHashes[i]) {
          decisions.push(j);
          break;
        }
        if (j === length - 1) {
          LoggingUtil.error('Could not count voting option');
        }
        baseVote = this.cryptoService.increaseVoteByOne(baseVote);
      }
    }
    return decisions;
  }

  /**
   * returns Keccak256 (hashing algorithm)
   * @param {string} data, that is supposed to be hashed
   * @return {string} string is now hashed
   */
  getKeccak256(data: string): string {
    return this.cryptoService.keccak256(data);
  }
}
