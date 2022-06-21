/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {SpinnerService} from '@core/services/spinner.service';
import {OracleService} from '@core/services/oracle.service';
import {SignatureService} from '@core/services/signature.service';
import {from, Observable, of} from 'rxjs';
import {Action} from '@ngrx/store';
import * as importUserActions from '@import-user/+state/import-user.actions';
import {catchError, map, switchMap} from 'rxjs/operators';
import {SignatureModel} from '@core/models/signature.model';
import * as core from '@core/+state/core.actions';
import {ToasterType} from '@core/models/toaster.model';
import {Spinner} from '@core/models/spinner.model';
import {ImportUser} from '@import-user/models/import-user.model';


@Injectable()
export class ImportUserEffects {

  constructor(private actions$: Actions,
              private spinnerService: SpinnerService,
              private oracleService: OracleService,
              private signatureService: SignatureService) {
  }

  readonly loadImportUsers$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(importUserActions.LoadImportedUsersAction),
      switchMap(() => {
        return this.signatureService.createSignature(false).pipe(
          switchMap((signature: SignatureModel) => {
            return this.oracleService.loadImportMembers(signature).pipe(
              map((importedUsers: ImportUser[]) =>
                importUserActions.LoadImportedUsersSuccessAction({importedUsers})),
              catchError(err => from([
                core.ErrorAction({message: err && err.message}),
                core.NotificationAction({
                  level: ToasterType.ERROR,
                  message: 'Message.Error.Load-Import-Members', err
                })
              ]))
            );
          })
        );
      })
    ));

  readonly removeImportUser$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(importUserActions.RemoveImportedUserAction),
      switchMap(({id, email}) => {
        return this.signatureService.createSignature(false).pipe(
          switchMap((signature: SignatureModel) => {
            this.spinnerService.addSpinner(Spinner.REMOVE_MEMBER);
            return this.oracleService.removeImportMember(email, signature).pipe(
              switchMap(() => {
                return of(importUserActions.RemoveImportedUserSuccessAction({id}));
              }),
              catchError(err => from([
                core.ErrorAction({message: err && err.message, spinner: Spinner.REMOVE_MEMBER}),
                core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Remove-Member', err})
              ]))
            );
          })
        );
      })
    ));

  readonly removeImportUserSuccess$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(importUserActions.RemoveImportedUserSuccessAction),
      switchMap(() => {
        this.spinnerService.removeSpinner(Spinner.REMOVE_MEMBER);
        return of(importUserActions.LoadImportedUsersAction());
      })
    ));

  readonly editImportUser$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(importUserActions.EditImportUserAction),
      switchMap(({editedImportUser}) => {
        return this.signatureService.createSignature(false).pipe(
          switchMap((signature: SignatureModel) => {
            this.spinnerService.addSpinner(Spinner.EDIT_IMPORT_USER);
            return this.oracleService.editImportUser(editedImportUser, signature).pipe(
              switchMap(() => {
                return of(importUserActions.EditImportUserSuccessAction());
              }),
              catchError(err => from([
                core.ErrorAction({message: err && err.message, spinner: Spinner.EDIT_IMPORT_USER}),
                core.NotificationAction({level: ToasterType.ERROR, message: 'Message.Error.Edit-Import-User', err})
              ]))
            );
          })
        );
      })
    ));

  readonly editImportUserSuccess: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(importUserActions.EditImportUserSuccessAction),
      switchMap(() => {
        this.spinnerService.removeSpinner(Spinner.EDIT_IMPORT_USER);
        return of(importUserActions.LoadImportedUsersAction());
      })
    ));
}
