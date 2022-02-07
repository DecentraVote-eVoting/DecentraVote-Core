/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {SpinnerService} from '@core/services/spinner.service';
import {MeetingContractService} from '@meeting/services/meeting-contract.service';
import {VotingContractService} from '@voting/services/voting-contract.service';
import {Action} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {EMPTY, from, Observable, of, zip} from 'rxjs';
import {Spinner} from '@core/models/spinner.model';
import {catchError, concatMap, first, flatMap, map, mergeMap, switchMap} from 'rxjs/operators';
import * as vote from './vote.actions';
import * as ballotBoxActions from './ballot-box.actions';
import {VoteModel} from '@voting/models/vote.model';
import {ToasterType} from '@core/models/toaster.model';
import * as core from '../../core/+state/core.actions';
import {TRANSACTION_STATUS_OK} from '@core/models/common.model';
import {StorageService} from '@core/services/storage.service';
import {BigNumber} from 'ethers';
import {TransactionReceipt, TransactionResponse} from '@ethersproject/abstract-provider';
import {VoteStage} from '@voting/models/vote-stage.enum';
import {CryptoFacade} from '@core/services/crypto.facade';
import {VoteFacade} from '@voting/services/vote.facade';
import {StorageVotingOption} from '@core/models/storage.model';
import {LoggingUtil} from '@core/utils/logging.util';
import {MeetingFacade} from '@meeting/services/meeting.facade';
import {space} from '@core/utils/pipe.util';
import {BallotDTO, OpenBallotNullifier, ZKProofDTO} from '@core/models/ballot-box.model';
import {SignatureService} from '@core/services/signature.service';
import {BallotBoxService} from '@core/services/ballot-box.service';
import {ZkProofService} from '@core/services/zk-proof.service';
import {ObjectUtil} from '@core/utils/object.util';
import {SignatureModel} from '@core/models/signature.model';
import {LambdaProofGenService} from '@core/services/lambda-proofgen.service';

@Injectable(
)
export class VotingEffects {

  constructor(private actions$: Actions,
              private spinnerService: SpinnerService,
              private meetingContractService: MeetingContractService,
              private votingContractService: VotingContractService,
              private storageService: StorageService,
              private cryptoFacade: CryptoFacade,
              private voteFacade: VoteFacade,
              private meetingFacade: MeetingFacade,
              private signatureService: SignatureService,
              private ballotBoxService: BallotBoxService,
              private zkProofService: ZkProofService,
              private lambdaProofGenService: LambdaProofGenService
  ) {
  }

  @Effect()
  readonly getVotes$: Observable<Action> = this.actions$.pipe(
    ofType(vote.GetVoteAddressesAction),
    switchMap(({generalMeetingAddress}) => {
        this.spinnerService.addSpinner(Spinner.LOAD_VOTINGS);
        return this.meetingContractService.getVoteAddressesFromMeeting(generalMeetingAddress).pipe(
          map((votingAddresses: string[]) => {
              return vote.GetVoteAddressesSuccessAction({
                voteModel: votingAddresses.map(address => <VoteModel>{address: address})
              });
            },
            catchError(err => from([
              vote.ErrorAction({message: err && err.message, spinner: Spinner.LOAD_VOTINGS}),
              core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Load-Votings', err})
            ]))
          )
        );
      }
    )
  );

  @Effect()
  readonly getVoteAddressesSuccess$ = this.actions$.pipe(
    ofType(vote.GetVoteAddressesSuccessAction),
    switchMap(({voteModel}) => {
      if (voteModel.length === 0) {
        this.spinnerService.removeSpinner(Spinner.LOAD_VOTINGS);
      }
      return from(voteModel.map(vm => vote.GetVoteDetailAction({
        voteAddress: vm.address
      })));
    })
  );

  @Effect()
  readonly getVoteDetail$: Observable<Action> = this.actions$.pipe(
    ofType(vote.GetVoteDetailAction),
    concatMap(({voteAddress, external}) => {
      return this.votingContractService.getVoteRaw(voteAddress);
    }),
    flatMap((voteRaw: VoteModel) => {
      let ballotAction: Action;
      if (ObjectUtil.isEmptyHash(voteRaw.treeHash)) {
        ballotAction = ballotBoxActions.GetBallotsFromBallotBoxService({
          voteAddress: voteRaw.address,
          isAnonymous: voteRaw.isAnonymous
        });
      } else {
        ballotAction = ballotBoxActions.GetBallotsFromStorageService({
          voteAddress: voteRaw.address,
          treeHash: voteRaw.treeHash,
          isAnonymous: voteRaw.isAnonymous
        });
      }
      return [
        ballotAction,
        vote.GetVoteDetailSuccessAction({voteRaw: voteRaw})
      ];
    }),
    catchError(err => from([
      vote.ErrorAction({message: err && err.message, spinner: Spinner.LOAD_VOTING_DETAILS}),
      core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Load-Votings', err})
    ]))
  );

  @Effect()
  readonly getVoteDetailSuccessAction$: Observable<Action> = this.actions$.pipe(
    ofType(vote.GetVoteDetailSuccessAction),
    switchMap(() => {
      this.spinnerService.removeSpinner(Spinner.LOAD_VOTINGS);
      return EMPTY;
    })
  );

  @Effect()
  readonly createVote$: Observable<Action> = this.actions$.pipe(
    ofType(vote.CreateVoteAction),
    mergeMap(({voteModel, metaData, attachment}) => {
      this.spinnerService.addSpinner(Spinner.CREATE_VOTING);
      return zip(
        this.storageService.saveJsonData(metaData),
        this.storageService.saveJsonMultiData(voteModel.voteOptions),
        this.storageService.saveBlobData(attachment)
      ).pipe(
        first(),
        switchMap(([
                     metaDataHashValue,
                     optionHashValues,
                     attachmentHashValue
                   ]) => {
          return this.meetingContractService.createVote(
            voteModel.meetingAddress,
            optionHashValues,
            metaDataHashValue,
            attachmentHashValue,
            voteModel.isAnonymous
          ).pipe(
            switchMap((tx: any) => {
              return Observable.fromPromise(tx.wait()).pipe(
                map((res: any) => {
                  if (res.status === TRANSACTION_STATUS_OK) {
                    return vote.CreateVoteSuccessAction();
                  } else {
                    throw new Error('Error mining Transaction');
                  }
                })
              );
            }),
            catchError(err => from([
              vote.ErrorAction({message: err && err.message, spinner: Spinner.CREATE_VOTING}),
              core.NotificationAction({
                level: ToasterType.ERROR,
                message: 'Message.Error.Create-Voting',
                err
              })
            ]))
          );
        }),
        catchError(err => from([
          vote.ErrorAction({message: err && err.message, spinner: Spinner.CREATE_VOTING}),
          core.NotificationAction({
            level: ToasterType.ERROR,
            message: err.message,
            err
          })
        ]))
      );
    })
  );

  @Effect()
  readonly createVoteSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(vote.CreateVoteSuccessAction),
    switchMap(() => {
      this.spinnerService.removeSpinner(Spinner.CREATE_VOTING);
      return EMPTY;
    })
  );

  @Effect()
  readonly editVote$: Observable<Action> = this.actions$.pipe(
    ofType(vote.EditVoteAction),
    switchMap(({voteModel, metaData, attachment}) => {
      this.spinnerService.addSpinner(Spinner.CHANGE_STATUS);
      return zip(
        this.storageService.saveJsonData(metaData),
        this.storageService.saveJsonMultiData(voteModel.voteOptions),
        this.storageService.saveBlobData(attachment)
      ).pipe(
        switchMap(([
                     metaDataHashValue,
                     optionHashValues,
                     attachmentHashValue
                   ]) => {
          return this.votingContractService.editVote(
            voteModel.address,
            metaDataHashValue,
            attachmentHashValue,
            optionHashValues,
            voteModel.isAnonymous
          ).pipe(
            switchMap((tx: any) => {
              return Observable.fromPromise(tx.wait()).pipe(
                map((res: any) => {
                  if (res.status === TRANSACTION_STATUS_OK) {
                    return vote.EditVoteSuccessAction({
                      voteAddress: voteModel.address
                    });
                  } else {
                    throw new Error('Error mining Transaction');
                  }
                })
              );
            }),
            catchError(err => from([
              vote.ErrorAction({message: err && err.message, spinner: Spinner.CHANGE_STATUS}),
              core.NotificationAction({
                level: ToasterType.ERROR,
                message: 'Message.Error.Update-Voting',
                err
              })
            ]))
          );
        })
      );
    })
  );

  @Effect()
  readonly editVoteSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(vote.EditVoteSuccessAction),
    map(({voteAddress}) => {
      this.spinnerService.removeSpinner(Spinner.CHANGE_STATUS);
      // TODO remove after event system update
      return vote.GetVoteDetailAction({voteAddress});
    })
  );

  @Effect()
  readonly changeStage$: Observable<Action> = this.actions$.pipe(
    ofType(vote.ChangeStageAction),
    space(500),
    mergeMap(({voteModel, stage, reason}) => {
      this.spinnerService.addSpinner(Spinner.CHANGE_STATUS);
      switch (stage) {
        case VoteStage.OPENED:
          return zip(
            this.cryptoFacade.getSecret(),
            this.meetingFacade.getLeaves(voteModel.meetingAddress)
          ).pipe(
            first(),
            map(([secret, _leaves]: [string, BigNumber[]]) => {
              const leaves = _leaves.reduce((acc, current, index) => {
                if (BigNumber.from(0).eq(current)) {
                  return [...acc, index];
                } else {
                  return acc;
                }
              }, []);
              return [this.cryptoFacade.getVoteKeyPairAffine(voteModel.address + secret + 'AAAAAAAAA'), leaves];
            }),
            switchMap(([[, publicKey], leaves]: [[bigint, bigint[]], number[]]) => {
              return this.votingContractService.openVoting(voteModel.address, publicKey, leaves);
            }),
            switchMap((tx: TransactionResponse) => Observable.fromPromise(tx.wait())),
            map((res: any) => {
              if (res.status === TRANSACTION_STATUS_OK) {
                return vote.ChangeStageSuccessAction({voteModel, stage});
              } else {
                throw new Error('Error mining Transaction');
              }
            })
          );
        case VoteStage.CLOSED:
          return this.votingContractService.closeVoting(voteModel.address).pipe(
            switchMap((tx: TransactionResponse) => Observable.fromPromise(tx.wait())),
            map((res: TransactionReceipt) => {
              if (res.status === TRANSACTION_STATUS_OK) {
                return vote.ChangeStageSuccessAction({voteModel, stage});
              } else {
                throw new Error('Error mining Transaction');
              }
            })
          );

        case VoteStage.COUNTED:
          return this.cryptoFacade.getSecret().pipe(
            first(),
            map((secret: string) => {
              return this.cryptoFacade.getVoteKeyPairAffine(voteModel.address + secret + 'AAAAAAAAA');
            }),
            switchMap(([privateKey, _]) => {
              return this.votingContractService.enableTallying(voteModel.address, privateKey);
            }),
            switchMap((tx: TransactionResponse) => {
              return Observable.fromPromise(tx.wait());
            }),
            map((res: TransactionReceipt) => {
              if (res.status === TRANSACTION_STATUS_OK) {
                return vote.ChangeStageSuccessAction({voteModel, stage});
              } else {
                throw new Error('Error mining Transaction');
              }
            })
          );

        case VoteStage.ARCHIVED:
          return this.storageService.saveJsonData(reason).pipe(
            first(),
            switchMap((reasonHash) => {
              return this.votingContractService.archiveVoting(voteModel.address, reasonHash).pipe(
                switchMap((tx: any) => {
                  return Observable.fromPromise(tx.wait()).pipe(
                    map((res: any) => {
                      if (res.status === TRANSACTION_STATUS_OK) {
                        return vote.ChangeStageSuccessAction({voteModel, stage, reason: reasonHash});
                      } else {
                        throw new Error('Error mining Transaction');
                      }
                    })
                  );
                })
              );
            })
          );
      }
    }),
    catchError(err => from([
      vote.ErrorAction({message: err && err.message, spinner: Spinner.CHANGE_STATUS}),
      core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Change-Stage', err})
    ]))
  );

  @Effect()
  readonly changeStageSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(vote.ChangeStageSuccessAction),
    switchMap(() => {
      this.spinnerService.removeSpinner(Spinner.CHANGE_STATUS);
      return EMPTY;
    })
  );

  @Effect()
  readonly deleteVote$: Observable<Action> = this.actions$.pipe(
    ofType(vote.DeleteVoteAction),
    switchMap(({meetingAddress, voteAddress}) => {
      this.spinnerService.addSpinner(Spinner.DELETE_VOTING);
      return this.meetingContractService.deleteVote(meetingAddress, voteAddress)
        .pipe(
          switchMap((tx: any) => {
            return Observable.fromPromise(tx.wait()).pipe(
              map((res: any) => {
                if (res.status === TRANSACTION_STATUS_OK) {
                  return vote.DeleteVoteSuccessAction({
                    meetingAddress,
                    voteAddress
                  });
                } else {
                  throw new Error('Error mining Transaction');
                }
              })
            );
          }),
          catchError(err => from([
            vote.ErrorAction({message: err && err.message, spinner: Spinner.DELETE_VOTING}),
            core.NotificationAction({
              level: ToasterType.ERROR,
              message: 'Message.Error.Update-Voting',
              err
            })
          ]))
        );
    })
  );

  @Effect()
  readonly deleteVoteSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(vote.DeleteVoteSuccessAction),
    switchMap(() => {
      this.spinnerService.removeSpinner(Spinner.DELETE_VOTING);
      return EMPTY;
    })
  );

  @Effect()
  readonly castVoteBB$: Observable<Action> = this.actions$.pipe(
    ofType(vote.CastVoteAction),
    space(500),
    mergeMap(({voteOptions, voteAddress, startIndex}) => {
      return zip(
        this.cryptoFacade.getSecret(),
        this.voteFacade.getVoteFromStore(voteAddress),
        this.voteFacade.getVoteOptions(voteAddress)
      ).pipe(
        first(),
        switchMap((
          [secret,
            voteRaw,
            possibleVoteOptions
          ]: [string, VoteModel, StorageVotingOption[]]) => {
          this.spinnerService.addSpinner(Spinner.CAST_VOTE);
          const chairmanPK = voteRaw.chairpersonPublicKey;
          const votingOptionIndices = voteOptions.map((option) => {
            return possibleVoteOptions.findIndex((element: StorageVotingOption) => element.value === option);
          });

          if (voteRaw.isAnonymous) {
            const signaturesTemp: Observable<SignatureModel>[] = [];
            const proofsTemp: Observable<ZKProofDTO>[] = [];

            for (let i = 0; i < votingOptionIndices.length; i++) {
              const anonMemberAddress = this.cryptoFacade.getAnonAddress(
                secret, voteRaw.root, voteRaw.index, (startIndex + i)
              );
              const ballot = this.cryptoFacade.createBallot(
                anonMemberAddress, secret, votingOptionIndices[i], voteAddress, chairmanPK
              );
              const anonParameters = this.zkProofService.getProofParams(
                anonMemberAddress, secret, (startIndex + i), voteRaw.leaves, voteRaw.index
              );
              proofsTemp.push(this.zkProofService.createProof(anonParameters).pipe(
                catchError(_ => this.lambdaProofGenService.createProof(anonParameters))
              ));
              signaturesTemp.push(this.signatureService.signBallots([ballot], anonMemberAddress).pipe(map(sig => sig[0])));
            }

            const proofs = zip(...proofsTemp);
            const signatures = zip(...signaturesTemp);
            return zip(signatures, proofs, of([]));

          } else {
            const memberAddress = this.cryptoFacade.getOpenAddress();
            const ballots = this.cryptoFacade.createBallots(memberAddress, secret, votingOptionIndices, voteAddress, chairmanPK);
            const nullifier = voteOptions.map((currElement, index) => <OpenBallotNullifier>{
              index: (startIndex + index),
              voteAddress,
              signer: memberAddress
            });
            return zip(
              this.signatureService.signBallots(ballots),
              of([]),
              this.signatureService.signNullifier(nullifier)
              );
          }
        }),
        map(([ballots, proofs, nullifier]) => {
            return ballots.map((ballot, index) => {
              return <BallotDTO>{
                zkProof: proofs[index] || null,
                signedDecision: ballot,
                signedNullifier: nullifier[index] || null
              };
            });
          }
        ),
        switchMap((castVotes: BallotDTO[] ) => {
          return zip(...castVotes.map(castVoteDTO => this.ballotBoxService.castVote(voteAddress, castVoteDTO, !!(castVoteDTO.zkProof))));
          }
        ),
        map((_) => {
          return vote.CastVoteSuccessAction({
            voteAddress: voteAddress
          });
        }),
        catchError(err => {
          return from(
            [
              vote.ErrorAction({message: err && err.message, spinner: Spinner.CAST_VOTE}),
              core.NotificationAction({
                level: ToasterType.ERROR,
                message: 'Message.Error.Cast-Vote',
                err
              })
            ]
          );
        })
      );
    })
  );

  @Effect()
  readonly voteSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(vote.CastVoteSuccessAction),
    switchMap(({voteAddress}) => {
      this.spinnerService.removeSpinner(Spinner.CAST_VOTE);
      return from([vote.GetVoteDetailAction({voteAddress})]);
    })
  );

  @Effect()
  readonly excludeFromVote$ = this.actions$.pipe(
    ofType(vote.ExcludeFromVoteAction),
    switchMap(({voteAddress, addressesToBlock}) => {
      this.spinnerService.addSpinner(Spinner.EXCLUDE_MEMBERS);
      return this.votingContractService.excludeFromVote(voteAddress, addressesToBlock).pipe(
        switchMap((tx: any) => {
          return Observable.fromPromise(tx.wait()).pipe(
            switchMap((res: any) => {
              if (res.status === TRANSACTION_STATUS_OK) {
                return of(vote.ExcludeFromVoteSuccessAction({
                  voteAddress,
                  addressesToBlock
                }));
              } else {
                throw new Error('Error mining Transaction');
              }
            })
          );
        }));
    })
  );

  @Effect()
  readonly excludeFromVoteSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(vote.ExcludeFromVoteSuccessAction),
    switchMap(() => {
      this.spinnerService.removeSpinner(Spinner.EXCLUDE_MEMBERS);
      return EMPTY;
    })
  );

  @Effect()
  readonly anonymousAccountAlreadyRegistered$: Observable<Action> = this.actions$.pipe(
    ofType(vote.AnonymousAccountAlreadyRegisteredAction),
    switchMap(() => {
      return EMPTY;
    })
  );

  @Effect()
  readonly error$: Observable<Action> = this.actions$.pipe(
    ofType(vote.ErrorAction),
    switchMap(({message, spinner}) => {
      LoggingUtil.error(message);
      if (spinner) {
        this.spinnerService.removeSpinner(spinner);
      }
      return EMPTY;
    })
  );
}
