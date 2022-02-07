/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {catchError, map, shareReplay, timeout} from 'rxjs/operators';
import {interval, Observable, throwError} from 'rxjs';
import {jwtUser} from '@app/user/models/user.model';
import {ROUTE_PATHS} from '@app/route-paths';
import {Store} from '@ngrx/store';
import {State} from '@app/app.store';
import {Router} from '@angular/router';
import {ENDPOINT_AUTH, ENDPOINT_ORACLE} from '@core/models/common.model';
import {SignatureService} from '@core/services/signature.service';
import {SignatureModel} from '@core/models/signature.model';
import {ImportUser, ImportUserRaw} from '@import-user/models/import-user.model';
import {EnvironmentService} from '@core/services/environment.service';

@Injectable({
  providedIn: 'root'
})
export class OracleService {
  private readonly commonHttpHeaders;

  // TODO should we get these config values from the contract instead?
  private oracleUrl = this.env.getOracleURL();

  constructor(private http: HttpClient,
              private store: Store<State>,
              private router: Router,
              private signatureService: SignatureService,
              private env: EnvironmentService) {
    // @ts-ignore
    this.commonHttpHeaders = new HttpHeaders({withCredentials: true})
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Access-Control-Allow-Origin', '*');
  }

  registerMember(address: string, hashedSecret: number): Observable<string> {
    return this.http.post(this.oracleUrl + ENDPOINT_ORACLE + `/member?secret=` + hashedSecret,
      address,
      {
        headers: this.commonHttpHeaders,
        responseType: 'text',
        withCredentials: true
      }
    ).pipe(
      catchError(err => {
        if (err.error.includes('Cognito')) {
          interval(4000).pipe(timeout(4100)).subscribe(_ =>
            this.router.navigate([ROUTE_PATHS.EXTERNAL_LOGOUT.valueOf()])
          );
        }
        return throwError(err);
      }),
      shareReplay(1),
      map(value => String(value))
    );
  }

  importUsers(importUsers: ImportUserRaw[], signature: SignatureModel): Observable<ImportUser[]> {
    return this.http.post<ImportUser[]>(this.oracleUrl + ENDPOINT_ORACLE + '/import',
      importUsers,
      {headers: this.signatureService.appendSignatureToHttpRequest(this.commonHttpHeaders, signature)});
  }

  loadImportMembers(signature: SignatureModel): Observable<ImportUser[]> {
    return this.http.get<ImportUser[]>(
      this.oracleUrl + ENDPOINT_ORACLE + '/import',
      {headers: this.signatureService.appendSignatureToHttpRequest(this.commonHttpHeaders, signature)}
    );
  }

  whoAmI(): Observable<jwtUser> {
    return this.http.get<jwtUser>(this.oracleUrl + ENDPOINT_ORACLE + '/whoAmI',
      {headers: this.commonHttpHeaders, withCredentials: true});
  }

  getAuthOptions(): Observable<string[]> {
    return this.http.get<string[]>(this.oracleUrl + ENDPOINT_AUTH + '/login/options',
      {headers: this.commonHttpHeaders});
  }

  sendToken(token: string): Observable<string> {
    return this.http.get(this.oracleUrl + ENDPOINT_AUTH + '/login/token?token=' + token + '&domain=' + window.location.host,
      {headers: this.commonHttpHeaders, withCredentials: true, responseType: 'text'});
  }

  removeImportMember(field0: string, signature: SignatureModel): Observable<void> {
    return this.http.post<void>(this.oracleUrl + ENDPOINT_ORACLE + '/import/remove',
      field0, {headers: this.signatureService.appendSignatureToHttpRequest(this.commonHttpHeaders, signature)});
  }

  replaceUser(address: string, signature: SignatureModel): Observable<string> {
    return this.http.post<string>(this.oracleUrl + ENDPOINT_ORACLE + '/import/replace',
      address, {headers: this.signatureService.appendSignatureToHttpRequest(this.commonHttpHeaders, signature)});
  }

  extendAccessCodeValidity(field0: string, signature: SignatureModel): Observable<void> {
    return this.http.post<void>(this.oracleUrl + ENDPOINT_ORACLE + '/import/extend',
      field0, {headers: this.signatureService.appendSignatureToHttpRequest(this.commonHttpHeaders, signature)});
  }

  replaceAccessCode(field0: string, signature: SignatureModel): Observable<void> {
    return this.http.post<void>(this.oracleUrl + ENDPOINT_ORACLE + '/import/replaceAccessCode',
      field0, {headers: this.signatureService.appendSignatureToHttpRequest(this.commonHttpHeaders, signature)});
  }

  editImportUser(editedImportUser: ImportUser, signature: SignatureModel): Observable<void> {
    return this.http.post<void>(this.oracleUrl + ENDPOINT_ORACLE + '/import/editImportUser',
      editedImportUser, {headers: this.signatureService.appendSignatureToHttpRequest(this.commonHttpHeaders, signature)});
  }
}
