/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {concatMap, distinctUntilChanged, ignoreElements, startWith} from 'rxjs/operators';
import {Observable} from 'rxjs/Observable';
import {timer} from "rxjs";

const equal = require('fast-deep-equal');

export function deepDistinctUntilChanged() {
  return function <T>(source: Observable<T>) {
    return source.pipe(
      distinctUntilChanged((a, b) => equal(a, b))
    );
  };
}

export function space(timeInMil: number) {
  return function <T>(source: Observable<T>) {
    return source.pipe(
      concatMap((value) => timer(timeInMil).pipe(
        ignoreElements(),
        startWith(value)
      ))
    )
  }
}
