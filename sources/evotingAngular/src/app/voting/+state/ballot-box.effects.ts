/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import * as voteActions from '@voting/+state/vote.actions';
import {EMPTY, from, Observable} from 'rxjs';
import {Action} from '@ngrx/store';
import {catchError, map, mergeMap, switchMap} from 'rxjs/operators';
import * as ballotBoxActions from '@voting/+state/ballot-box.actions';
import {Spinner} from '@core/models/spinner.model';
import * as core from '@core/+state/core.actions';
import {ToasterType} from '@core/models/toaster.model';
import {BallotBoxService} from '@core/services/ballot-box.service';
import {StorageService} from '@core/services/storage.service';
import {SignatureContent, SignatureModel} from '@core/models/signature.model';
import {Ballot, ZKProofDTO} from '@core/models/ballot-box.model';
import {VerifiableBallot} from '@voting/models/ballot-box.model';


@Injectable(
)
export class BallotBoxEffects {

  constructor(
    private actions$: Actions,
    private ballotBoxService: BallotBoxService,
    private storageService: StorageService
  ) {}

  @Effect()
  readonly getBallotsFromService$: Observable<Action> = this.actions$.pipe(
    ofType(ballotBoxActions.GetBallotsFromBallotBoxService),
    mergeMap(({voteAddress, isAnonymous}) => {
      return this.ballotBoxService.getAllVotes(voteAddress, isAnonymous).pipe(
        map((votesJson) => {
          return votesJson.map(json => {
            const signature: SignatureModel = {...json.signedDecision};
            const ballot: Ballot = JSON.parse(signature.message);

            if (isAnonymous) {
              const zkProof: ZKProofDTO = {...json.zkProof};
              return <VerifiableBallot>{
                ballot: ballot,
                zkProof: zkProof,
                signedDecision: signature,
                signedNullifier: null
              };
            } else {
              const openNullifier: SignatureModel = {...json.signedNullifier};
              return <VerifiableBallot>{
                ballot: ballot,
                zkProof: null,
                signedDecision: signature,
                signedNullifier: openNullifier
              };
            }
          });
        }),
        map((ballots: VerifiableBallot[]) => ballotBoxActions.GetBallotsSuccess({
          voteAddress: voteAddress,
          verifiableBallots: ballots
        })),
        catchError(err => from([
          voteActions.ErrorAction({message: err && err.message, spinner: Spinner.LOAD_VOTING_DETAILS}),
          core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Load-Votings', err})
        ]))
      );
    }),
  );

  @Effect()
  readonly getBallotBoxFromStorage$: Observable<Action> = this.actions$.pipe(
    ofType(ballotBoxActions.GetBallotsFromStorageService),
    mergeMap(({voteAddress, treeHash, isAnonymous}) => {
      return this.storageService.getData(treeHash).pipe(
        map((data) => {
          const leaves = JSON.parse(data);
          return leaves.map(leaf => {
            const signature: SignatureModel = {...leaf.signedDecision};
            const ballot: Ballot = JSON.parse(signature.message);

            if (isAnonymous) {
              const zkProof: ZKProofDTO = {...leaf.zkProof};
              return <VerifiableBallot>{
                ballot: ballot,
                zkProof: zkProof,
                signedDecision: signature,
                signedNullifier: null,
                signerAddress: zkProof.publicSignals[0]
              };
            } else {
              const openNullifier: SignatureModel = {...leaf.signedNullifier};
              const signatureContent: SignatureContent = JSON.parse(leaf.signedNullifier.message);
              return <VerifiableBallot>{
                ballot: ballot,
                zkProof: null,
                signedDecision: signature,
                signedNullifier: openNullifier,
                signerAddress: signatureContent.signer
              };
            }
          });
        }),
        map((ballots: VerifiableBallot[]) => {
          return ballotBoxActions.GetBallotsSuccess({voteAddress: voteAddress, verifiableBallots: ballots});
        })
      );
    }),
    catchError(err => from([
      voteActions.ErrorAction({message: err && err.message, spinner: Spinner.LOAD_VOTING_DETAILS}),
      core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Load-Votings', err})
    ]))
  );

  @Effect()
  readonly getBallotsSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(ballotBoxActions.GetBallotsSuccess),
    switchMap(({voteAddress, verifiableBallots}) => {
      return EMPTY;
    })
  );
}
