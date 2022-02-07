/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {ToasterInfo} from '../models/toaster.model';

@Injectable({providedIn: 'root'})
export class ToasterService {

  toaster$ = new Subject<ToasterInfo[]>();
  toasterArray = [];

  constructor() {
  }

  addToaster(toaster: ToasterInfo) {
    this.toasterArray.push(toaster);
    this.toaster$.next(this.toasterArray);

    setTimeout(() => {
      this.removeToaster(toaster);
    }, 5000);
  }

  removeToaster(toaster: ToasterInfo) {
    if (!this.toasterArray.includes(toaster)) {
      return;
    }
    this.toasterArray = this.toasterArray.filter(x => x !== toaster);
    this.toaster$.next(this.toasterArray);
  }

  getToasts(): Observable<ToasterInfo[]> {
    return this.toaster$;
  }

}
