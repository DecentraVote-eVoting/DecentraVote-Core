/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import * as importUserActions from '@import-user/+state/import-user.actions';
import {Store} from '@ngrx/store';
import * as fromRoot from '@app/app.store';
import {Observable, throwError} from 'rxjs';
import memoizee from 'memoizee';
import {catchError, map, shareReplay, switchMap} from 'rxjs/operators';
import * as importUserReducer from '@import-user/+state/import-user.reducer';
import {deepDistinctUntilChanged} from '@core/utils/pipe.util';
import {ImportUser, ImportUserRaw} from '@import-user/models/import-user.model';
import {User} from '@app/user/models/user.model';
import {SignatureModel} from '@core/models/signature.model';
import {ToasterType} from '@core/models/toaster.model';
import {SignatureService} from '@core/services/signature.service';
import {ToasterService} from '@core/services/toaster.service';
import {OracleService} from '@core/services/oracle.service';

@Injectable({
  providedIn: 'root'
})
export class ImportUserFacade {

  constructor(private store: Store<fromRoot.State>,
              private signatureService: SignatureService,
              private toasterService: ToasterService,
              private oracleService: OracleService) {
  }

  /**
   * returns all imported users
   * @return {Observable<User[]>}
   */
  getImportedUsers: (() => Observable<ImportUser[]>) = memoizee(() => {
    return this.store.pipe(
      map(importUserReducer.selectors.selectAll),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * remove already imported user by dispatching action.
   */
  removeImportedUser(id: number, email: string) {
    this.store.dispatch(importUserActions.RemoveImportedUserAction({id, email}));
  }

  /**
   * imports all users by dispatching action.
   */
  dispatchImportUsers() {
    this.store.dispatch(importUserActions.LoadImportedUsersAction());
  }

  importUsers(importUsersRaw: ImportUserRaw[]) {
    this.signatureService.createSignature(false).pipe(
      switchMap((signature: SignatureModel) => {
        return this.oracleService.importUsers(importUsersRaw, signature)
          .pipe(catchError(_ => {
            this.toasterService.addToaster({
              type: ToasterType.ERROR,
              message: 'Message.Error.Import-Members'
            });
            return throwError(_);
          }));
      })).subscribe((_) => {
      this.dispatchImportUsers();
      this.toasterService.addToaster({
        type: ToasterType.SUCCESS,
        message: 'Message.Success.Import-Members'
      });
    });
  }
}
