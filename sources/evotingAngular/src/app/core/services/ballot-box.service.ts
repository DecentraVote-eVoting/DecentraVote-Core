/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {filter, map, mergeMap, shareReplay, switchMap, tap} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {State} from '@app/app.store';
import * as fromCore from '../+state/core.reducer';
import * as core from '../+state/core.actions';
import {Observable} from 'rxjs/Observable';
import {BallotDTO} from '@core/models/ballot-box.model';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {SignatureService} from '@core/services/signature.service';
import {zip} from 'rxjs';
import {BallotBoxServer} from '@core/models/storage.model';
import {SignatureModel, VoteCertificate} from '@core/models/signature.model';

@Injectable({
  providedIn: 'root'
})
export class BallotBoxService {
  private ballotBoxUrls$ = this.store.pipe(select(fromCore.getBallotBoxServer));

  private readonly commonHttpHeaders;

  constructor(private http: HttpClient,
              private signatureService: SignatureService,
              private store: Store<State>) {

    this.commonHttpHeaders = new HttpHeaders()
      .set('withCredentials', 'true')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Access-Control-Allow-Origin', '*');
  }

  getRandomBallotBox(): Observable<BallotBoxServer> {
    return this.ballotBoxUrls$.pipe(
      tap(val => {
        if (val === null) {
          this.store.dispatch(core.LoadBallotBoxUrlsAction());
        }
      }),
      filter(val => val !== null && val.length > 0),
      map(urls => {
        const index = Math.floor(Math.random() * urls.length);
        return urls[index];
      })
    );
  }

  castVote(voteAddress, vote: BallotDTO, anonymous: boolean): Observable<VoteCertificate> {
    return this.getRandomBallotBox().pipe(
      switchMap((ballotBox: BallotBoxServer) => {
        const path = (anonymous) ? 'anonymous/' : 'open/';
        return this.http.post<SignatureModel>(ballotBox.url + '/api/ballotbox/' + path + voteAddress, vote).pipe(
            map((certificate: SignatureModel) => {
              delete certificate['signingAddress'];
              return {certificate, ballotBox};
            })
          );
      })
    );
  }

  getAllVotes(voteAddress: string, anonymous: boolean): Observable<any> {
    return zip(
      this.signatureService.createSignature(false),
      this.getRandomBallotBox()
    ).pipe(
      mergeMap(([signature, ballotBox]) => {
        const path = (anonymous) ? 'anonymous/' : 'open/';
        return this.http.get(
          ballotBox.url + '/api/ballotbox/' + path + voteAddress,
          {
            headers: this.signatureService.appendSignatureToHttpRequest(this.commonHttpHeaders, signature)
          }
        ).pipe(
          map((response) => (response) ? response : []),
          shareReplay({bufferSize: 1, refCount: true}),
        );
      })
    );
  }

  getAllCastedVotes(voteAddress: string, anonymous: boolean): Observable<number> {
    return zip(
      this.signatureService.createSignature(false),
      this.getRandomBallotBox()
    ).pipe(
      mergeMap(([signature, ballotBox]) => {
        const path = (anonymous) ? 'anonymous/' : 'open/';
        return this.http.get<number>(
          ballotBox.url + '/api/ballotbox/' + path + voteAddress + '/voteCast',
          {
            headers: this.signatureService.appendSignatureToHttpRequest(this.commonHttpHeaders, signature)
          }
        ).pipe(
          map((response: number) => (response) ? response : 0),
          shareReplay({bufferSize: 1, refCount: true}),
        );
      })
    );
  }
}
