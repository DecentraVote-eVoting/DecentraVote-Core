/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {EMPTY, from, Observable} from 'rxjs';
import {catchError, map, mergeMap, switchMap} from 'rxjs/operators';
import * as meetingActions from './meeting.actions';
import {MeetingContractService} from '../services/meeting-contract.service';
import {OrganizationContractService} from '@core/services/organization-contract.service';
import {Action} from '@ngrx/store';
import {SpinnerService} from '@core/services/spinner.service';
import {Spinner} from '@core/models/spinner.model';
import {MeetingModel} from '@meeting/models/meeting.model';
import {TRANSACTION_STATUS_OK} from '@core/models/common.model';
import * as core from '@core/+state/core.actions';
import {ToasterType} from '@core/models/toaster.model';
import {CryptoFacade} from '@core/services/crypto.facade';
import {LoggingUtil} from '@core/utils/logging.util';
import {MeetingFacade} from '@meeting/services/meeting.facade';
import {StorageService} from '@core/services/storage.service';
import {StorageMetaData} from '@core/models/storage.model';
import {ROUTE_PATHS} from '@app/route-paths';
import {Router} from '@angular/router';

@Injectable(
)
export class MeetingEffects {

  constructor(private actions$: Actions,
              private spinnerService: SpinnerService,
              private organizationContractService: OrganizationContractService,
              private meetingContractService: MeetingContractService,
              private cryptoFacade: CryptoFacade,
              private meetingFacade: MeetingFacade,
              private storageService: StorageService,
              private router: Router) {
  }

  @Effect()
  readonly getMeetings$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.GetMeetingAddressesAction),
    switchMap(() => {
        this.spinnerService.addSpinner(Spinner.LOAD_MEETINGS);
        return this.organizationContractService.getMeetings().pipe(
          map((votingAddresses: string[]) => {
            return meetingActions.GetMeetingAddressesSuccessAction({
              meetings: votingAddresses.map(addr => {
                return {
                  address: addr,
                } as MeetingModel;
              })
            });
          }),
          catchError(err => from([
            meetingActions.ErrorAction({message: err && err.message, spinner: Spinner.LOAD_MEETINGS}),
          ]))
        );
      }
    )
  );

  @Effect()
  readonly getMeetingsAddressesSuccess$ = this.actions$.pipe(
    ofType(meetingActions.GetMeetingAddressesSuccessAction),
    switchMap(({meetings: items}) => {
      this.spinnerService.removeSpinner(Spinner.LOAD_MEETINGS);
      return from(items.map(m => meetingActions.GetMeetingDetailAction({address: m.address})));
    })
  );

  @Effect()
  readonly getMeetingDetail$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.GetMeetingDetailAction),
    mergeMap(({address}) => {
      this.spinnerService.addSpinner(Spinner.LOAD_MEETING_DETAILS);
      return this.meetingContractService.getMeetingDto(address).pipe(
        switchMap(meeting => {
          const representedBy = {};
          for (let i = 0; i < meeting.representees.length; i++) {
            representedBy[meeting.representees[i]] = meeting.representatives[i];
          }
          return this.meetingFacade.getResolvedMetaDataFromHash(meeting.metaDataHash || '0').pipe(
            map(metaData => {
              const title = metaData.title == null ? '' : metaData.title;
              const description = metaData.description == null ? '' : metaData.description;

              return meetingActions.GetMeetingDetailSuccessAction({
                // TODO: promisedToVote & hasGivenAuthority
                meeting: {
                  ...meeting,
                  title: title,
                  description: description,
                  startDate: new Date(meeting.startDate * 1000),
                  endDate: new Date(meeting.endDate * 1000),
                  address: address,
                  representedBy: representedBy,
                }
              });
            })
          );
        })
      );
    })
  );

  @Effect()
  readonly getMeetingDetailSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.GetMeetingDetailSuccessAction),
    switchMap(() => {
      this.spinnerService.removeSpinner(Spinner.LOAD_MEETING_DETAILS);
      return EMPTY;
    })
  );

  @Effect()
  readonly createMeeting$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.CreateMeetingAction),
    switchMap(({meeting}) => {
      if (meeting.startDate > meeting.endDate) {
        const err = 'End date is not allowed to predate start date';
        return from([
          meetingActions.ErrorAction({message: err && err, spinner: Spinner.CREATE_MEETING}),
          core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Create-Meeting', err})
        ]);
      }
      this.spinnerService.addSpinner(Spinner.CREATE_MEETING);

      const storageData: StorageMetaData = {
        title: meeting.title,
        description: meeting.description,
      };
      return this.storageService.saveJsonData(storageData).pipe(
        switchMap(metaDataHashValue => {
          return this.organizationContractService.createMeeting(
            meeting.startDate,
            meeting.endDate,
            meeting.chairperson,
            metaDataHashValue,
          ).pipe(
            switchMap((tx: any) => {
              return Observable.fromPromise(tx.wait()).pipe(
                map((res: any) => {
                  if (res.status === TRANSACTION_STATUS_OK) {
                    return meetingActions.CreateMeetingSuccessAction();
                  } else {
                    throw new Error('Error mining Transaction');
                  }
                })
              );
            }),
            catchError(err => {
                return from([
                  meetingActions.ErrorAction({message: err && err.message, spinner: Spinner.CREATE_MEETING}),
                  core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Create-Meeting', err})
                ]);
              }
            )
          );
        })
      );
    })
  );

  @Effect()
  readonly createMeetingSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.CreateMeetingSuccessAction),
    switchMap(() => {
      this.spinnerService.removeSpinner(Spinner.CREATE_MEETING);
      return EMPTY;
    })
  );

  @Effect()
  readonly deleteMeeting$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.DeleteMeetingAction),
    switchMap(({meetingAddress}) => {
      this.spinnerService.addSpinner(Spinner.DELETE_MEETING);
      return this.organizationContractService.removeMeeting(meetingAddress)
        .pipe(
          switchMap((tx: any) => {
            return Observable.fromPromise(tx.wait()).pipe(
              map((res: any) => {
                if (res.status === TRANSACTION_STATUS_OK) {
                  return meetingActions.DeleteMeetingSuccessAction({meetingAddress});
                } else {
                  throw new Error('Error mining Transaction');
                }
              })
            );
          }),
          catchError(err => from([
            meetingActions.ErrorAction({message: err && err.message, spinner: Spinner.DELETE_MEETING}),
            core.NotificationAction({
              level: ToasterType.ERROR,
              message: 'Message.Error.Delete-Meeting',
              err
            })
          ]))
        );
    })
  );

  @Effect()
  readonly deleteMeetingSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.DeleteMeetingSuccessAction),
    switchMap(() => {
      this.spinnerService.removeSpinner(Spinner.DELETE_MEETING);
      return EMPTY;
    })
  );

  @Effect()
  readonly deleteMeetingEvent$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.DeleteMeetingEvent),
    switchMap(({meetingAddress}) => {
      if (this.router.url === `/meeting/detail/${meetingAddress}`) {
        this.router.navigate([ROUTE_PATHS.MEETING_OVERVIEW.valueOf()]).catch(_ => console.warn('Could not navigate to route'));
      }
      return EMPTY;
    })
  );

  @Effect()
  readonly updateMeeting$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.UpdateMeetingAction),
    switchMap(({meeting}) => {
      this.spinnerService.addSpinner(Spinner.EDIT_MEETING);

      const storageData: StorageMetaData = {
        title: meeting.title,
        description: meeting.description,
      };
      return this.storageService.saveJsonData(storageData).pipe(
        switchMap(metaDataHash => {
          return this.meetingContractService.changeMeetingDetails(
            meeting.address,
            meeting.chairperson,
            meeting.startDate,
            meeting.endDate,
            metaDataHash
          )
        }),
        switchMap((tx: any) => {
          return Observable.fromPromise(tx.wait()).pipe(
            map((res: any) => {
              if (res.status === TRANSACTION_STATUS_OK) {
                return meetingActions.UpdateMeetingSuccessAction({meeting});
              } else {
                throw new Error('Error mining Transaction');
              }
            })
          );
        }),
        catchError(err => from([
          meetingActions.ErrorAction({message: err && err.message, spinner: Spinner.EDIT_MEETING}),
          core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Update-Meeting', err})
        ]))
      );
    })
  );

  @Effect()
  readonly updateMeetingSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.UpdateMeetingSuccessAction),
    switchMap(() => {
      this.spinnerService.removeSpinner(Spinner.EDIT_MEETING);
      return EMPTY;
    })
  );

  @Effect()
  readonly sortVotesOfMeeting$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.SortVotesOfMeetingAction),
    switchMap(({meetingAddress, voteAddresses}) => {
      this.spinnerService.addSpinner(Spinner.SORT_VOTING);
      return this.meetingContractService.changeVoteOrder(meetingAddress, voteAddresses).pipe(
        switchMap((tx: any) => {
          return Observable.fromPromise(tx.wait()).pipe(
            map((res: any) => {
              if (res.status === TRANSACTION_STATUS_OK) {
                return meetingActions.SortVotesOfMeetingSuccessAction();
              } else {
                throw new Error('Error mining Transaction');
              }
            })
          );
        }),
        catchError(err => from([
          meetingActions.ErrorAction({message: err && err.message, spinner: Spinner.SORT_VOTING}),
          // TODO Add Notification
          // core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Add-Authority', err})
        ]))
      );
    })
  );

  @Effect()
  readonly sortVotesSuccess: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.SortVotesOfMeetingSuccessAction),
    switchMap(() => {
      this.spinnerService.removeSpinner(Spinner.SORT_VOTING);
      return EMPTY;
    })
  );

  @Effect()
  readonly addRepresentation$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.AddRepresentationAction),
    switchMap(({meeting, representeeAddress, representativeAddress}) => {
      this.spinnerService.addSpinner(Spinner.CREATE_AUTHORITY);
      return this.meetingContractService.handoverMandate(meeting.address, representeeAddress, representativeAddress)
        .pipe(
          switchMap((tx: any) => {
            return Observable.fromPromise(tx.wait()).pipe(
              map((res: any) => {
                if (res.status === TRANSACTION_STATUS_OK) {
                  return meetingActions.AddRepresentationSuccessAction({meeting});
                } else {
                  throw new Error('Error mining Transaction');
                }
              })
            );
          }),
          catchError(err => from([
            meetingActions.ErrorAction({message: err && err.message, spinner: Spinner.CREATE_AUTHORITY}),
            core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Add-Authority', err})
          ]))
        );
    })
  );

  @Effect()
  readonly addRepresentationSuccess: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.AddRepresentationSuccessAction),
    switchMap(({meeting}) => {
      this.spinnerService.removeSpinner(Spinner.CREATE_AUTHORITY);
      return EMPTY;
    })
  );

  @Effect()
  readonly removeRepresentation$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.RemoveRepresentationAction),
    switchMap(({meeting, member}) => {
      this.spinnerService.addSpinner(Spinner.REMOVE_AUTHORITY);
      return this.meetingContractService.removeMandate(
        meeting.address,
        member.address).pipe(
        switchMap((tx: any) => {
          return Observable.fromPromise(tx.wait()).pipe(
            map((res: any) => {
              if (res.status === TRANSACTION_STATUS_OK) {
                return meetingActions.RemoveRepresentationSuccessAction({meeting});
              } else {
                throw new Error('Error mining Transaction');
              }
            })
          );
        }),
        catchError(err => from([
          meetingActions.ErrorAction({message: err && err.message, spinner: Spinner.REMOVE_AUTHORITY}),
          core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Remove-Authority', err})
        ]))
      );
    })
  );

  @Effect()
  readonly removeRepresentationSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.RemoveRepresentationSuccessAction),
    switchMap(({meeting}) => {
      this.spinnerService.removeSpinner(Spinner.REMOVE_AUTHORITY);
      return EMPTY;
    })
  );

  @Effect()
  readonly toggleMeetingVisibility$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.ToggleMeetingVisibilityAction),
    switchMap(({meeting}) => {
      this.spinnerService.addSpinner(Spinner.TOGGLE_MEETING_VISIBILITY);
      return this.meetingContractService.toggleMeetingVisibility(meeting.address).pipe(
        switchMap((transaction: any) => {
          return Observable.fromPromise(transaction.wait()).pipe(
            map((res: any) => {
              if (res.status === TRANSACTION_STATUS_OK) {
                return meetingActions.ToggleMeetingVisibilitySuccessAction({meeting});
              } else {
                throw new Error('Error mining Transaction');
              }
            })
          );
        }),
        catchError(err => from([
          meetingActions.ErrorAction({message: err && err.message, spinner: Spinner.TOGGLE_MEETING_VISIBILITY}),
          core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Toggle-Meeting-Visibility', err})
        ]))
      );
    })
  );

  @Effect()
  readonly toggleMeetingVisibilitySuccess$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.ToggleMeetingVisibilitySuccessAction),
    switchMap(() => {
      this.spinnerService.removeSpinner(Spinner.TOGGLE_MEETING_VISIBILITY);
      return EMPTY;
    })
  );

  @Effect()
  readonly openRegistrationStage: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.OpenRegistrationStageAction),
    switchMap(({meeting}) => {
      this.spinnerService.addSpinner(Spinner.OPEN_REGISTRATION);
      return this.meetingContractService.openRegistration(meeting.address).pipe(
        switchMap((transaction: any) => {
          return Observable.fromPromise(transaction.wait()).pipe(
            map((res: any) => {
              if (res.status === TRANSACTION_STATUS_OK) {
                return meetingActions.OpenRegistrationStageSuccessAction({meeting});
              } else {
                throw new Error('Error mining Transaction');
              }
            })
          );
        }),
        catchError(err => from([
          meetingActions.ErrorAction({message: err && err.message, spinner: Spinner.OPEN_REGISTRATION}),
          core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Open-Registration', err})
        ]))
      );
    })
  );

  @Effect()
  readonly openRegistrationSuccessSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.OpenRegistrationStageSuccessAction),
    switchMap(() => {
      this.spinnerService.removeSpinner(Spinner.OPEN_REGISTRATION);
      return EMPTY;
    })
  );

  @Effect()
  readonly closeRegistrationStage$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.CloseRegistrationStageAction),
    switchMap(({meeting}) => {
      this.spinnerService.addSpinner(Spinner.CLOSE_REGISTER);
      return this.meetingContractService.closeRegistrationStage(meeting.address).pipe(
        switchMap((transaction: any) => {
          return Observable.fromPromise(transaction.wait()).pipe(
            map((res: any) => {
              if (res.status === TRANSACTION_STATUS_OK) {
                return meetingActions.CloseRegistrationStageSuccessAction({meeting});
              } else {
                throw new Error('Error mining Transaction');
              }
            })
          );
        }),
        catchError(err => from([
          meetingActions.ErrorAction({message: err && err.message, spinner: Spinner.CLOSE_REGISTER}),
          core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Close-Registration', err})
        ]))
      );
    })
  );

  @Effect()
  readonly closeRegistrationStageSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.CloseRegistrationStageSuccessAction),
    switchMap(() => {
      this.spinnerService.removeSpinner(Spinner.CLOSE_REGISTER);
      return EMPTY;
    })
  );

  @Effect()
  readonly openMeeting$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.OpenMeetingAction),
    switchMap(({meeting}) => {
      this.spinnerService.addSpinner(Spinner.OPEN_MEETING);
      return this.meetingContractService.openMeeting(meeting.address).pipe(
        switchMap((transaction: any) => {
          return Observable.fromPromise(transaction.wait()).pipe(
            map((res: any) => {
              if (res.status === TRANSACTION_STATUS_OK) {
                return meetingActions.OpenMeetingSuccessAction({meeting});
              } else {
                throw new Error('Error mining Transaction');
              }
            })
          );
        }),
        catchError(err => from([
          meetingActions.ErrorAction({message: err && err.message, spinner: Spinner.OPEN_MEETING}),
          core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Open-Meeting', err})
        ]))
      );
    })
  );

  @Effect()
  readonly openMeetingSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.OpenMeetingSuccessAction),
    switchMap(() => {
      this.spinnerService.removeSpinner(Spinner.OPEN_MEETING);
      return EMPTY;
    })
  );

  @Effect()
  readonly closeMeeting$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.CloseMeetingAction),
    switchMap(({meeting}) => {
      this.spinnerService.addSpinner(Spinner.CLOSE_MEETING);
      return this.meetingContractService.closeMeeting(meeting.address).pipe(
        switchMap((transaction: any) => {
          return Observable.fromPromise(transaction.wait()).pipe(
            map((res: any) => {
              if (res.status === TRANSACTION_STATUS_OK) {
                return meetingActions.CloseMeetingSuccessAction({meeting});
              } else {
                throw new Error('Error mining Transaction');
              }
            })
          );
        }),
        catchError(err => from([
          meetingActions.ErrorAction({message: err && err.message, spinner: Spinner.CLOSE_MEETING}),
          core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Close-Meeting', err})
        ]))
      );
    })
  );

  @Effect()
  readonly closeMeetingSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.CloseMeetingSuccessAction),
    switchMap(() => {
      this.spinnerService.removeSpinner(Spinner.CLOSE_MEETING);
      return EMPTY;
    })
  );

  @Effect()
  readonly joinMeeting$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.JoinMeetingAction),
    switchMap(({meeting}) => {
      this.spinnerService.addSpinner(Spinner.JOIN_MEETING);
      return this.cryptoFacade.getSecretHash().pipe(
        switchMap((secretHash: number) => {
          return this.meetingContractService.promiseToVote(meeting.address, secretHash).pipe(
            switchMap((transaction: any) => {
              return Observable.fromPromise(transaction.wait()).pipe(
                map((res: any) => {
                  if (res.status === TRANSACTION_STATUS_OK) {
                    return meetingActions.JoinMeetingSuccessAction({meeting});
                  } else {
                    throw new Error('Error mining Transaction');
                  }
                })
              );
            }),
            catchError(err => from([
              meetingActions.ErrorAction({message: err && err.message, spinner: Spinner.JOIN_MEETING}),
              core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Join-Meeting', err})
            ]))
          );
        })
      );
    })
  );

  @Effect()
  readonly joinMeetingFinished$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.JoinMeetingSuccessAction),
    switchMap(() => {
      this.spinnerService.removeSpinner(Spinner.JOIN_MEETING);
      return EMPTY;
    })
  );

  @Effect()
  readonly error$: Observable<Action> = this.actions$.pipe(
    ofType(meetingActions.ErrorAction),
    switchMap(({message, spinner}) => {
      LoggingUtil.error(message);
      if (spinner) {
        this.spinnerService.removeSpinner(spinner);
      }
      return EMPTY;
    })
  );
}
