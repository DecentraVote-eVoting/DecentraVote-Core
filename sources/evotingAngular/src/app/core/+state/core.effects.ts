/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import * as core from './core.actions';
import {EMPTY, from, Observable} from 'rxjs';
import {catchError, map, mergeMap, switchMap} from 'rxjs/operators';
import {Action, Store} from '@ngrx/store';
import {StorageService} from '../services/storage.service';
import {LoggingUtil} from '../utils/logging.util';
import {ToasterService} from '../services/toaster.service';
import {ToasterType} from '../models/toaster.model';
import {SpinnerService} from '../services/spinner.service';
import {OrganizationContractService} from '../services/organization-contract.service';
import {BallotBoxServer, StorageServer} from '../models/storage.model';
import {CryptoFacade} from '../services/crypto.facade';
import {State} from '@app/app.store';
import {ZkProofService} from '../services/zk-proof.service';
import {ArrayUtil} from '@core/utils/array.util';
import {OracleService} from '@core/services/oracle.service';

@Injectable()
export class CoreEffects {

  constructor(private actions$: Actions,
              private organizationContractService: OrganizationContractService,
              private storageService: StorageService,
              private toasterService: ToasterService,
              private spinnerService: SpinnerService,
              private cryptoFacade: CryptoFacade,
              private store: Store<State>,
              private zkProofService: ZkProofService,
              private oracleService: OracleService
  ) {
  }

  readonly loadStorageUrls$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(core.LoadStorageUrlsAction),
      switchMap(() => {
        return this.organizationContractService.loadStorageUrls().pipe(
          map(([addresses, urls, owners]: [[], string, []]) => {
            const urlList = urls.split(' ');
            const storages: StorageServer[] = [];
            for (let i = 0; i < addresses.length; i++) {
              storages.push({
                address: addresses[i],
                url: urlList[i],
                owner: owners[i]
              });
            }
            return storages;
          }),
          map((list: StorageServer[]) => {
            ArrayUtil.shuffle(list);
            return core.LoadStorageUrlsSuccessAction({list});
          }),
          catchError(err => from([
            core.ErrorAction({message: err && err.message}),
            core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Load-Storage-URLs', err})
          ]))
        );
      })
    ));

  readonly loadBallotBoxUrls$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(core.LoadBallotBoxUrlsAction),
      switchMap(() => {
        return this.organizationContractService.loadBallotBoxUrls().pipe(
          map(([addresses, urls, owners]: [[], string, []]) => {
            const urlList = urls.split(' ');
            const ballotboxes: BallotBoxServer[] = [];
            for (let i = 0; i < addresses.length; i++) {
              ballotboxes.push({
                address: addresses[i],
                url: urlList[i],
                owner: owners[i]
              });
            }
            return ballotboxes;
          }),
          map((list: BallotBoxServer[]) => {
            ArrayUtil.shuffle(list);
            return core.LoadBallotBoxUrlsSuccessAction({list});
          }),
          catchError(err => from([
            core.ErrorAction({message: err && err.message}),
            core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Load-BallotBox-URLs', err})
          ]))
        );
      })
    ));

  readonly notification$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(core.NotificationAction),
      mergeMap(({level, message, err}) => {
        this.toasterService.addToaster({type: level, message});
        return EMPTY;
      })
    ), {dispatch: false}
  );

  readonly getAuthOptions$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(core.GetAuthOptionsAction),
      switchMap(() => {
        return this.oracleService.getAuthOptions().pipe(
          map((options) => {
            return core.GetAuthOptionsSuccessAction({options});
          })
        );
      }),
      catchError(err => from([
        core.ErrorAction({message: err && err.message}),
        core.NotificationAction({
          level: ToasterType.ERROR,
          message: 'Message.Error.Oracle', err
        })
      ]))
    ));

  readonly error$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(core.ErrorAction),
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
