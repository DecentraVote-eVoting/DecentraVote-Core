/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {VerifiableBallot} from '@voting/models/ballot-box.model';
import {Observable} from 'rxjs/Observable';
import {combineLatest, of, ReplaySubject, zip} from 'rxjs';
import {catchError, concatAll, concatMap, delay, filter, first, map, switchMap, tap} from 'rxjs/operators';
import {BigNumber, ethers} from 'ethers';
import {VoteFacade} from '@voting/services/vote.facade';
import {ZkProofService} from '@core/services/zk-proof.service';
import {SignatureContent} from '@core/models/signature.model';
import {MeetingFacade} from '@meeting/services/meeting.facade';
import {MeetingContractService} from '@meeting/services/meeting-contract.service';
import * as dummyBallot from '@voting/models/dummy-ballot.json';

export interface BallotError {
  message: string;
  ballot: VerifiableBallot;
}

export interface CheckedBallot {
  ballot: VerifiableBallot;
  valid: boolean;
}

@Injectable()
export class VoteVerificationService {

  leavesEvent$: ReplaySubject<BigNumber[]> = new ReplaySubject(1);
  secretsEvent$: ReplaySubject<{ [p: string]: BigNumber }> = new ReplaySubject(1);

  nullifierCount: { [key: string]: number } = {};
  nullifierOpenCount: { [signer: string]: { [index: string]: number } } = {};

  constructor(private voteFacade: VoteFacade,
              private zkProofService: ZkProofService,
              private meetingFacade: MeetingFacade,
              private meetingContractService: MeetingContractService) {
  }


  prepareVerification(meetingAddress: string, voteAddress: string) {
    this.voteFacade.getLeaves(voteAddress).pipe(
      map((leaves: BigNumber[]) => {
        return leaves.filter(leaf => leaf !== ethers.constants.Zero);
      })
    ).subscribe(this.leavesEvent$);

    this.meetingFacade.getRegisteredVoterAddresses(meetingAddress).pipe(
      filter(addresses => addresses != null),
      switchMap(addresses => {
        return this.meetingContractService.getHashedSecrets(meetingAddress, addresses).pipe(
          map(secrets => {
            return {
              addresses: addresses,
              secrets: secrets
            };
          }),
          map((secretMapping: {}) => {
            const secrets: { [address: string]: BigNumber } = {};
            for (let i = 0; i < secretMapping['addresses'].length; i++) {
              secrets[secretMapping['addresses'][i]] = secretMapping['secrets'][i];
            }
            return secrets;
          })
        );
      })
    ).subscribe(this.secretsEvent$);
  }

  verifyDummyBallot(): Observable<boolean> {
    return this.zkProofService.verifyProof(undefined, dummyBallot.proof, dummyBallot.publicSignals);
  }

  anonymousVerification(verifiableBallots: VerifiableBallot[], voteAddress: string): Observable<CheckedBallot> {
    return this.verifyDummyBallot().pipe(
      switchMap(() => of(verifiableBallots)),
      tap(ballots => {
        ballots
          .map(ballot => ballot.zkProof.publicSignals[3])
          .forEach(nullifier => {
            this.nullifierCount[nullifier] = this.nullifierCount[nullifier] + 1 || 1;
          });
        console.log('[Anon] Verifying Ballots...');
      }),
      concatAll(),
      concatMap(ballot => {
        return zip(
          this.verifyNullifierAnonUnique(ballot.zkProof.publicSignals[3], ballot),
          this.verifyDecisionSignature(ballot),
          this.verifyRoot(voteAddress, ballot),
        ).pipe(
          switchMap(_ => this.verifyProof(ballot)),
          map(_ => {
            return {ballot: ballot, valid: true};
          }),
          catchError((err: BallotError) => {
            console.error(err.message);
            return of({ballot: err.ballot, valid: false});
          })
        );
      })
    );
  }

  verifyNullifierAnonUnique(nullifier: string, verifiableBallot: VerifiableBallot): Observable<void> {
    return of(verifiableBallot).pipe(
      map(ballot => {
        if (this.nullifierCount[nullifier] !== 1) {
          throw {message: 'verifying nullifier unique', ballot: ballot};
        }
      })
    );
  }

  verifyDecisionSignature(verifiableBallot: VerifiableBallot): Observable<void> {
    return of(verifiableBallot).pipe(
      map(ballot => {
        const anonSignerAddress = BigNumber.from(ballot.zkProof.publicSignals[0])._hex;
        const decisionAddress = ethers.utils.verifyMessage(
          ballot.signedDecision.message,
          ballot.signedDecision.signature
        ).toLocaleLowerCase();

        if (decisionAddress !== anonSignerAddress) {
          throw {message: 'failed to verify decision signature', ballot: ballot};
        }
      })
    );
  }

  verifyRoot(voteAddress: string, ballot: VerifiableBallot): Observable<void> {
    return this.voteFacade.getRoot(voteAddress).pipe(
      first(),
      map(root => {
        const zkProofRoot = BigNumber.from(ballot.zkProof.publicSignals[1]);
        if (root._hex !== zkProofRoot._hex) {
          throw {message: 'Invalid Root', ballot: ballot};
        }
      })
    );
  }

  verifyProof(ballot): Observable<void> {
    return this.zkProofService.verifyProof(undefined, ballot.zkProof.proof, ballot.zkProof.publicSignals).pipe(
      map(isValid => {
        if (!isValid) {
          throw {message: 'Invalid Proof', ballot: ballot};
        }
      })
    );
  }

  openVerification(verifiableBallots: VerifiableBallot[]): Observable<CheckedBallot> {
    return of(verifiableBallots).pipe(
      tap(ballots => {
        this.nullifierOpenCount = {};
        ballots.map(ballot => JSON.parse(ballot.signedNullifier.message)).forEach((nullifier: SignatureContent) => {
          if (!this.nullifierOpenCount[nullifier.signer]) {
            this.nullifierOpenCount[nullifier.signer] = {};
          }
          const currentIndexCount = this.nullifierOpenCount[nullifier.signer][nullifier.index];
          this.nullifierOpenCount[nullifier.signer][nullifier.index] = currentIndexCount + 1 || 1;
        });
        console.log('[Open] Verifying Ballots...');
      }),
      concatAll(),
      concatMap(ballot => {
        return zip(
          this.verifyNullifierOpenUnique(ballot),
          this.verifyNonAnonymousDecisionSignature(ballot),
          this.verifyNullifier(ballot))
          .pipe(
            delay(10),
            map(_ => ({ballot: ballot, valid: true})),
            catchError((err: BallotError) => {
              console.error(err.message);
              return of({ballot: err.ballot, valid: false});
            })
          );
      })
    );
  }

  verifyNullifierOpenUnique(verifiableBallot: VerifiableBallot): Observable<void> {
    return of(verifiableBallot).pipe(
      map(ballot => {
          const nullifier: SignatureContent = JSON.parse(ballot.signedNullifier.message);
          if (this.nullifierOpenCount[nullifier.signer][nullifier.index] > 1) {
            throw {message: 'verifying nullifier unique', ballot: ballot};
          }
        }
      )
    );
  }

  verifyNonAnonymousDecisionSignature(verifiableBallot: VerifiableBallot): Observable<void> {
    return of(verifiableBallot).pipe(
      map(ballot => {
        const decisionAddress = ethers.utils.verifyMessage(
          ballot.signedDecision.message,
          ballot.signedDecision.signature
        ).toLocaleLowerCase();
        const nullifierAddress = ethers.utils.verifyMessage(
          ballot.signedNullifier.message,
          ballot.signedNullifier.signature
        ).toLocaleLowerCase();

        if (decisionAddress !== nullifierAddress) {
          throw {message: 'failed to verify decision signature', ballot: ballot};
        }
      })
    );
  }

  verifyNullifier(ballot: VerifiableBallot): Observable<void> {
    const nullifier = JSON.parse(ballot.signedNullifier.message);
    return combineLatest([
      this.secretsEvent$,
      this.leavesEvent$
    ]).pipe(
      map(([secrets, leaves]: [{}, BigNumber[]]) => leaves.filter((leaf: BigNumber) =>
        leaf._hex === secrets[nullifier.signer]._hex).length),
      map(count => {
        if (nullifier.index >= count) {
          throw {message: 'failed to verify index < voting count', ballot: ballot};
        }
      })
    );
  }

}
