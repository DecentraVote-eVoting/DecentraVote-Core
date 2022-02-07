/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {SpinnerInfo} from '../models/spinner.model';

@Injectable({providedIn: 'root'})
export class SpinnerService {

  spinner$ = new Subject<SpinnerInfo[]>();
  spinnerArray = [];

  constructor() {
  }

  addSpinner(spinner: SpinnerInfo) {
    this.spinnerArray.push(spinner);
    this.spinner$.next(this.spinnerArray);
  }

  removeSpinner(spinner: SpinnerInfo) {
    if (!this.spinnerArray.includes(spinner)) {
      return;
    }
    this.spinnerArray = this.spinnerArray.filter(x => x !== spinner);
    this.spinner$.next(this.spinnerArray);
  }

  getSpinner(): Observable<SpinnerInfo[]> {
    return this.spinner$;
  }

}
