/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {from, Observable, of, zip} from 'rxjs';
import {CACHE_CLEANUP_DAYS, CACHE_DATE_ADDED, CACHE_NAME, CACHE_REQUEST} from '@core/models/common.model';
import {catchError, map, mergeAll, switchMap, tap} from 'rxjs/operators';
import {DateUtil} from '@core/models/date.util';
import {CacheMultiResponse} from '@core/models/storage.model';

@Injectable({
  providedIn: 'root'
})
export class CacheService {

  private cache: Observable<Cache> = of(null);

  constructor() {
    if (typeof caches === 'undefined') {
      console.error('Caches is not defined! This may occur when trying to connect on mobile via http instead of https. Continuing without caching feature.')
    } else {
      this.cache = from(caches.open(CACHE_NAME));
    }
  }

  getMultipleItems(keys: string[]): Observable<CacheMultiResponse[]> {
    return zip(...keys.map(k => this.getItem(k)));
  }

  getItem(key: string): Observable<CacheMultiResponse> {
    return this.cache.pipe(
      switchMap((cache: Cache) => from(cache.match(key))),
      switchMap((response: Response) => from(response.text())),
      map((text: string) => <CacheMultiResponse>{hash: key, data: text}),
      catchError(_ => {
        return of(null);
      })
    );
  }

  setItem(key: string, value: string) {
    this.cache.subscribe(cache => {
      if (cache) {
        const response = new Response(value);
        response.headers.append(CACHE_DATE_ADDED, DateUtil.formatNow());
        response.headers.append(CACHE_REQUEST, key);
        cache.put(key, response).catch(_ => {
          console.warn(`Could not save cache entry for: ${key}`);
        });
      }
    });
  }

  cleanUp() {
    this.cache.pipe(
      tap((cache) => {
        from(cache.matchAll()).pipe(
          mergeAll(),
          tap((response: Response) => {
            const dateAdded = response.headers.get(CACHE_DATE_ADDED) || DateUtil.formatNow();
            if (DateUtil.dateDiffDays(dateAdded, DateUtil.formatNow()) >= CACHE_CLEANUP_DAYS) {
              const request = response.headers.get(CACHE_REQUEST) || '';

              cache.delete(request).catch(_ => console.warn(`Could not remove cache entry for: ${request}`));
            }
          })
        );
      }),
      catchError(_ => of(null))
    ).subscribe();
  }

}
