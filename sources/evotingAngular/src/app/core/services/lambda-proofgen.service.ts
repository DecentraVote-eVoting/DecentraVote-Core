/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ENDPOINT_ALT_PROOFGEN} from '@core/models/common.model';

@Injectable({
  providedIn: 'root'
})
export class LambdaProofGenService {
  private readonly commonHttpHeaders;

  private url = ENDPOINT_ALT_PROOFGEN;

  constructor(private http: HttpClient) {
    // @ts-ignore
    this.commonHttpHeaders = new HttpHeaders({withCredentials: true})
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Access-Control-Allow-Origin', '*');
  }

  createProof(params: any): Observable<any> {
    return this.http.post(this.url, params, {
      headers: this.commonHttpHeaders,
    });
  }
}
