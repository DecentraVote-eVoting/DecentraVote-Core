/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
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

  readonly getMeetings$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
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
    ));

  readonly getMeetingsAddressesSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.GetMeetingAddressesSuccessAction),
      switchMap(({meetings: items}) => {
        this.spinnerService.removeSpinner(Spinner.LOAD_MEETINGS);
        return from(items.map(m => meetingActions.GetMeetingDetailAction({address: m.address})));
      })
    ));

  readonly getMeetingDetail$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
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
    ));

  readonly getMeetingDetailSuccess$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.GetMeetingDetailSuccessAction),
      switchMap(() => {
        this.spinnerService.removeSpinner(Spinner.LOAD_MEETING_DETAILS);
        return EMPTY;
      })
    ), {dispatch: false}
  );

  readonly createMeeting$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
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
                return from(tx.wait()).pipe(
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
    ));

  readonly createMeetingSuccess$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.CreateMeetingSuccessAction),
      switchMap(() => {
        this.spinnerService.removeSpinner(Spinner.CREATE_MEETING);
        return EMPTY;
      })
    ), {dispatch: false}
  );

  readonly deleteMeeting$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.DeleteMeetingAction),
      switchMap(({meetingAddress}) => {
        this.spinnerService.addSpinner(Spinner.DELETE_MEETING);
        return this.organizationContractService.removeMeeting(meetingAddress)
          .pipe(
            switchMap((tx: any) => {
              return from<Promise<any>>(tx.wait()).pipe(
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
    ));

  readonly deleteMeetingSuccess$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.DeleteMeetingSuccessAction),
      switchMap(() => {
        this.spinnerService.removeSpinner(Spinner.DELETE_MEETING);
        return EMPTY;
      })
    ), {dispatch: false}
  );

  readonly deleteMeetingEvent$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.DeleteMeetingEvent),
      switchMap(({meetingAddress}) => {
        if (this.router.url === `/meeting/detail/${meetingAddress}`) {
          this.router.navigate([ROUTE_PATHS.MEETING_OVERVIEW.valueOf()]).catch(_ => console.warn('Could not navigate to route'));
        }
        return EMPTY;
      })
    ), {dispatch: false}
  );

  readonly updateMeeting$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
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
            );
          }),
          switchMap((tx: any) => {
            return from<Promise<any>>(tx.wait()).pipe(
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
    ));

  readonly updateMeetingSuccess$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.UpdateMeetingSuccessAction),
      switchMap(() => {
        this.spinnerService.removeSpinner(Spinner.EDIT_MEETING);
        return EMPTY;
      })
    ), {dispatch: false}
  );

  readonly sortVotesOfMeeting$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.SortVotesOfMeetingAction),
      switchMap(({meetingAddress, voteAddresses}) => {
        this.spinnerService.addSpinner(Spinner.SORT_VOTING);
        return this.meetingContractService.changeVoteOrder(meetingAddress, voteAddresses).pipe(
          switchMap((tx: any) => {
            return from<Promise<any>>(tx.wait()).pipe(
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
    ));

  readonly sortVotesSuccess: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.SortVotesOfMeetingSuccessAction),
      switchMap(() => {
        this.spinnerService.removeSpinner(Spinner.SORT_VOTING);
        return EMPTY;
      })
    ), {dispatch: false}
  );

  readonly addRepresentation$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.AddRepresentationAction),
      switchMap(({meeting, representeeAddress, representativeAddress}) => {
        this.spinnerService.addSpinner(Spinner.CREATE_AUTHORITY);
        return this.meetingContractService.handoverMandate(meeting.address, representeeAddress, representativeAddress)
          .pipe(
            switchMap((tx: any) => {
              return from<Promise<any>>(tx.wait()).pipe(
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
    ));

  readonly addRepresentationSuccess: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.AddRepresentationSuccessAction),
      switchMap(({meeting}) => {
        this.spinnerService.removeSpinner(Spinner.CREATE_AUTHORITY);
        return EMPTY;
      })
    ), {dispatch: false}
  );

  readonly removeRepresentation$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.RemoveRepresentationAction),
      switchMap(({meeting, member}) => {
        this.spinnerService.addSpinner(Spinner.REMOVE_AUTHORITY);
        return this.meetingContractService.removeMandate(
          meeting.address,
          member.address).pipe(
          switchMap((tx: any) => {
            return from<Promise<any>>(tx.wait()).pipe(
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
    ));

  readonly removeRepresentationSuccess$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.RemoveRepresentationSuccessAction),
      switchMap(({meeting}) => {
        this.spinnerService.removeSpinner(Spinner.REMOVE_AUTHORITY);
        return EMPTY;
      })
    ), {dispatch: false}
  );

  readonly toggleMeetingVisibility$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.ToggleMeetingVisibilityAction),
      switchMap(({meeting}) => {
        this.spinnerService.addSpinner(Spinner.TOGGLE_MEETING_VISIBILITY);
        return this.meetingContractService.toggleMeetingVisibility(meeting.address).pipe(
          switchMap((transaction: any) => {
            return from<Promise<any>>(transaction.wait()).pipe(
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
    ));

  readonly toggleMeetingVisibilitySuccess$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.ToggleMeetingVisibilitySuccessAction),
      switchMap(() => {
        this.spinnerService.removeSpinner(Spinner.TOGGLE_MEETING_VISIBILITY);
        return EMPTY;
      })
    ), {dispatch: false}
  );

  readonly openRegistrationStage: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.OpenRegistrationStageAction),
      switchMap(({meeting}) => {
        this.spinnerService.addSpinner(Spinner.OPEN_REGISTRATION);
        return this.meetingContractService.openRegistration(meeting.address).pipe(
          switchMap((transaction: any) => {
            return from<Promise<any>>(transaction.wait()).pipe(
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
    ));

  readonly openRegistrationSuccessSuccess$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.OpenRegistrationStageSuccessAction),
      switchMap(() => {
        this.spinnerService.removeSpinner(Spinner.OPEN_REGISTRATION);
        return EMPTY;
      })
    ), {dispatch: false}
  );

  readonly closeRegistrationStage$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.CloseRegistrationStageAction),
      switchMap(({meeting}) => {
        this.spinnerService.addSpinner(Spinner.CLOSE_REGISTER);
        return this.meetingContractService.closeRegistrationStage(meeting.address).pipe(
          switchMap((transaction: any) => {
            return from<Promise<any>>(transaction.wait()).pipe(
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
    ));

  readonly closeRegistrationStageSuccess$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.CloseRegistrationStageSuccessAction),
      switchMap(() => {
        this.spinnerService.removeSpinner(Spinner.CLOSE_REGISTER);
        return EMPTY;
      })
    ), {dispatch: false}
  );

  readonly openMeeting$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.OpenMeetingAction),
      switchMap(({meeting}) => {
        this.spinnerService.addSpinner(Spinner.OPEN_MEETING);
        return this.meetingContractService.openMeeting(meeting.address).pipe(
          switchMap((transaction: any) => {
            return from<Promise<any>>(transaction.wait()).pipe(
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
    ));

  readonly openMeetingSuccess$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.OpenMeetingSuccessAction),
      switchMap(() => {
        this.spinnerService.removeSpinner(Spinner.OPEN_MEETING);
        return EMPTY;
      })
    ), {dispatch: false}
  );

  readonly closeMeeting$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.CloseMeetingAction),
      switchMap(({meeting}) => {
        this.spinnerService.addSpinner(Spinner.CLOSE_MEETING);
        return this.meetingContractService.closeMeeting(meeting.address).pipe(
          switchMap((transaction: any) => {
            return from<Promise<any>>(transaction.wait()).pipe(
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
    ));

  readonly closeMeetingSuccess$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.CloseMeetingSuccessAction),
      switchMap(() => {
        this.spinnerService.removeSpinner(Spinner.CLOSE_MEETING);
        return EMPTY;
      })
    ), {dispatch: false}
  );

  readonly joinMeeting$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.JoinMeetingAction),
      switchMap(({meeting}) => {
        this.spinnerService.addSpinner(Spinner.JOIN_MEETING);
        return this.cryptoFacade.getSecretHash().pipe(
          switchMap((secretHash: number) => {
            return this.meetingContractService.promiseToVote(meeting.address, secretHash).pipe(
              switchMap((transaction: any) => {
                return from<Promise<any>>(transaction.wait()).pipe(
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
    ));

  readonly joinMeetingFinished$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.JoinMeetingSuccessAction),
      switchMap(() => {
        this.spinnerService.removeSpinner(Spinner.JOIN_MEETING);
        return EMPTY;
      })
    ), {dispatch: false}
  );

  readonly error$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(meetingActions.ErrorAction),
      switchMap(({message, spinner}) => {
        LoggingUtil.error(message);
        if (spinner) {
          this.spinnerService.removeSpinner(spinner);
        }
        return EMPTY;
      })
    ), {dispatch: false}
  );
}
