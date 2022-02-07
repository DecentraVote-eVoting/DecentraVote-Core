/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Actions, Effect, ofType} from '@ngrx/effects';
import {EMPTY, from, Observable} from 'rxjs';
import {catchError, map, mergeMap, switchMap} from 'rxjs/operators';
import {Action} from '@ngrx/store';
import {Injectable} from '@angular/core';
import * as userActions from './user.actions';
import {Spinner} from '@core/models/spinner.model';
import {ToasterType} from '@core/models/toaster.model';
import {SpinnerService} from '@core/services/spinner.service';
import {OrganizationContractService} from '@core/services/organization-contract.service';
import * as core from '../../core/+state/core.actions';
import {OracleService} from '@core/services/oracle.service';
import {SignatureService} from '@core/services/signature.service';
import {ResolvedClaim, User} from '@app/user/models/user.model';
import {StorageService} from '@core/services/storage.service';
import {StorageClaim} from '@core/models/storage.model';
import {Role} from '@user/models/role.model';

@Injectable()
export class UserEffects {

  constructor(private actions$: Actions,
              private spinnerService: SpinnerService,
              private oracleService: OracleService,
              private signatureService: SignatureService,
              private organizationContractService: OrganizationContractService,
              private storageService: StorageService) {
  }

  @Effect()
  readonly loadUsers$: Observable<Action> = this.actions$.pipe(
    ofType(userActions.LoadUsersAction),
    switchMap(() => {
      return this.organizationContractService.listOfUser().pipe(
        switchMap((listOfMembers: [string[], string[], number[]]) => {
          return this.storageService.getMultipleUsersByAddresses(listOfMembers);
        }),
        map((users: User[]) => userActions.LoadUsersSuccessAction({users})),
        catchError(err => from([
          core.ErrorAction({message: err && err.message}),
          core.NotificationAction({
            level: ToasterType.ERROR,
            message: 'Message.Error.Load-Members', err
          })
        ]))
      );
    })
  );

  @Effect()
  readonly getUserDetail$: Observable<Action> = this.actions$.pipe(
    ofType(userActions.GetUserDetailAction),
    mergeMap(({userAddress, claimHash, roleNumber}) => {
      return this.storageService.getJsonData(claimHash).pipe(
        map((storageData: StorageClaim) => {
          return {
            address: userAddress,
            claimHash: claimHash,
            resolvedClaim: {
              ...storageData
            } as ResolvedClaim,
            role: new Role(roleNumber.toNumber())
          } as User;
        })
      );
    }),
    map((user: User) => userActions.GetUserDetailSuccessAction({user: user})),
    catchError(err => from([
      core.ErrorAction({message: err && err.message}),
      core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Get-Member-Detail', err})
    ]))
  );

  @Effect()
  readonly getUserDetailSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(userActions.GetUserDetailSuccessAction),
    switchMap((_) => {
      return EMPTY;
    }),
    catchError(err => from([
      core.ErrorAction({message: err && err.message}),
      core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Load-Members', err})
    ]))
  );

  @Effect()
  readonly editUser$: Observable<Action> = this.actions$.pipe(
    ofType(userActions.EditUserAction),
    switchMap(({user}) => {

      const storageClaim: StorageClaim = {
        field1: user.resolvedClaim.field1,
        field2: user.resolvedClaim.field2,
        field0: user.resolvedClaim.field0
      };

      return this.storageService.saveJsonData(storageClaim).pipe(
        switchMap((claimHash: string) => {
          this.spinnerService.addSpinner(Spinner.EDIT_MEMBER);
          return this.organizationContractService.editUser(user.address, claimHash, user.role.value).pipe(
            switchMap((tx: any) => {
              return Observable.fromPromise(tx.wait()).pipe(
                switchMap(() => {
                  return EMPTY;
                })
              );
            }),
            catchError(err => from([
              core.ErrorAction({message: err && err.error, spinner: Spinner.EDIT_MEMBER}),
              core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Edit-Member', err})
            ]))
          );
        })
      );
    })
  );

  @Effect()
  readonly editUserSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(userActions.EditUserSuccessAction),
    switchMap(() => {
      this.spinnerService.removeSpinner(Spinner.EDIT_MEMBER);
      return EMPTY;
    })
  );


  @Effect()
  readonly removeUser$: Observable<Action> = this.actions$.pipe(
    ofType(userActions.RemoveUserAction),
    switchMap(({address, claimHash}) => {
      this.spinnerService.addSpinner(Spinner.REMOVE_MEMBER);
      return this.organizationContractService.editUser(address, claimHash, 0).pipe(
        map(() => {
          return userActions.RemoveUserSuccessAction({address});
        }),
        catchError(err => {
            return from([
              core.ErrorAction({message: err && err.error, spinner: Spinner.REMOVE_MEMBER}),
              core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Remove-Member', err})
            ]);
          }
        )
      );
    })
  );

  @Effect()
  readonly removeUserSuccess$: Observable<Action> = this.actions$.pipe(
    ofType(userActions.RemoveUserSuccessAction),
    switchMap(() => {
      this.spinnerService.removeSpinner(Spinner.REMOVE_MEMBER);
      return EMPTY;
    })
  );
}
