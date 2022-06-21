/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {combineLatest, from, Observable, of} from 'rxjs';
import {catchError, concatMap, filter, first, map, mergeMap, switchMap, tap, timeout} from 'rxjs/operators';
import {
  CacheMultiResponse,
  StorageClaim,
  StorageData,
  StorageDTO,
  StorageMultiResponse,
  StorageServer
} from '../models/storage.model';
import {LoggingUtil} from '../utils/logging.util';
import {select, Store} from '@ngrx/store';
import {State} from '@app/app.store';
import * as fromCore from '../+state/core.reducer';
import * as core from '../+state/core.actions';
import {OrganizationContractService} from './organization-contract.service';
import {CryptoFacade} from './crypto.facade';
import {ResolvedClaim, User} from '@app/user/models/user.model';
import {CacheService} from '@core/services/cache.service';
import {ENDPOINT_STORAGE_GET, ENDPOINT_STORAGE_SAVE} from '@core/models/common.model';
import {ObjectUtil} from '@core/utils/object.util';
import {SignatureService} from '@core/services/signature.service';
import {SignatureModel} from '@core/models/signature.model';
import {Role} from '@user/models/role.model';
import {ToasterService} from '@core/services/toaster.service';
import {ToasterType} from '@core/models/toaster.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private readonly REQUEST_TIMEOUT: number = 60000;
  private storageUrls$ = this.store.pipe(select(fromCore.getStorageServer));
  private readonly commonHttpHeaders;

  constructor(private http: HttpClient,
              private store: Store<State>,
              private cacheService: CacheService,
              private organizationContractService: OrganizationContractService,
              private cryptoFacade: CryptoFacade,
              private signatureService: SignatureService,
              private toasterService: ToasterService
  ) {
    // @ts-ignore
    this.commonHttpHeaders = new HttpHeaders({withCredentials: true})
      .set('Access-Control-Allow-Origin', '*');
  }

  // Get Methods
  public getBlobData(hash): Observable<Blob> {
    if (ObjectUtil.isEmptyHash(hash)) {
      return of(null);
    }
    return this.getData(hash).pipe(map(val => StorageService.dataURItoBlob(val)));
  }

  public getJsonData(hash): Observable<StorageData> {
    if (ObjectUtil.isEmptyHash(hash)) {
      return of({});
    }
    return this.getData(hash).pipe(map(val => JSON.parse(val)));
  }

  public getData(hash: string, publicResource: boolean = false): Observable<string> {
    return this.cacheService.getItem(hash)
      .pipe(first(),
        mergeMap(cachedResponse => {
          if (!cachedResponse) {
            return this.getDataFromStorage(hash, publicResource);
          } else {
            return of(cachedResponse.data);
          }
        }));
  }

  private getDataFromStorage(hash: string, publicResource: boolean, numberOfTries: number = 0, start?: number): Observable<string> {
    return this.signatureService.createSignature(publicResource).pipe(
      switchMap((signature: SignatureModel) => {
        return this.getAllStorageServer().pipe(
          concatMap((servers: StorageServer[]) => {
            if (numberOfTries === 0) {
              start = Math.floor(Math.random() * servers.length);
            }
            const index = (start + numberOfTries) % servers.length;
            if (index === start && numberOfTries > 0) {
              throw Error('Could not get data with hash:' + hash + ' from any server');
            }
            const url = servers[numberOfTries].url;
            let customHeaders;
            if (publicResource) {
              customHeaders = this.commonHttpHeaders;
              customHeaders.append('Public', 'true');
            } else {
              customHeaders = this.signatureService.appendSignatureToHttpRequest(this.commonHttpHeaders, signature);
            }
            return this.http.post(
              url + ENDPOINT_STORAGE_GET,
              [hash],
              {
                headers: customHeaders,
                responseType: 'json'
              }
            ).pipe(
              timeout(this.REQUEST_TIMEOUT),
              map((json: {} ) => {
                const _data = json[0].data;
                const hashFromResponse = this.cryptoFacade.getKeccak256(_data);
                if (hash !== hashFromResponse) {
                  this.toasterService.addToaster({
                    type: ToasterType.ERROR,
                    message: 'Message.Error.Hash-Not-Equal'
                  });
                  throw Error(`hash value not equal: ${hash} != ${hashFromResponse}`);
                }
                this.cacheService.setItem(hash, _data);
                return _data;
              }),
              catchError((err) => {
                LoggingUtil.error(err);
                return this.getDataFromStorage(hash, publicResource, numberOfTries + 1, start);
              })
            );
          })
        );
      }));
  }

  public getJsonMultiData(hashes: string[]): Observable<StorageData[]> {
    return this.getMultiData(hashes)
      .pipe(first(), switchMap((data) => {
        return of(data.map(d => JSON.parse(d.data)));
      }));
  }

  public getMultiData(hashes: string[]): Observable<StorageDTO[]> {
    return this.getMultiDataFromCache(hashes).pipe(
      first(),
      concatMap((cachedList: CacheMultiResponse[]) => {
        return combineLatest([
          this.getMultiDataFromStorage(hashes.filter(hash => !cachedList.map(obj => obj.hash).includes(hash))),
          of(cachedList)
        ]).pipe(
          map(([storage, cache]) => {
            const responseList = [...storage, ...cache];
            return hashes.map(hash => responseList.find(item => item.hash === hash));
          })
        );
      }),
    );
  }

  private getMultiDataFromCache(hashes: string[]): Observable<CacheMultiResponse[]> {
    if (hashes.length === 0) {
      return of([]);
    }
    return this.cacheService.getMultipleItems(hashes).pipe(
      switchMap((cachedList: CacheMultiResponse[]) => {
        return of(cachedList.filter((item: CacheMultiResponse) => item !== null));
      })
    );
  }

  private getMultiDataFromStorage(hashes: string[], numberOfTries: number = 0, start?: number): Observable<StorageMultiResponse[]> {
    if (hashes.length === 0) {
      return of([]);
    }
    return this.signatureService.createSignature(false).pipe(
      switchMap((signature: SignatureModel) => {
        return this.getAllStorageServer().pipe(
          concatMap((servers: StorageServer[]) => {
            if (numberOfTries === 0) {
              start = Math.floor(Math.random() * servers.length);
            }
            const index = (start + numberOfTries) % servers.length;
            if (index === start && numberOfTries > 0) {
              throw Error('Could not get data with hashes:' + hashes + ' from any server');
            }
            const url = servers[numberOfTries].url;
            const customHeaders = this.signatureService.appendSignatureToHttpRequest(this.commonHttpHeaders, signature);
            return this.http.post(
              url + ENDPOINT_STORAGE_GET,
              hashes,
              {
                headers: customHeaders,
                responseType: 'json'
              }
            ).pipe(
              timeout(this.REQUEST_TIMEOUT),
              map((data: [{'hash', 'data'}]) => {
                return hashes.map((hash: string) => {
                  const _data = data.find(j => j.hash === hash).data;
                  const hashFromResponse = this.cryptoFacade.getKeccak256(_data);
                  if (hash !== hashFromResponse) {
                    this.toasterService.addToaster({
                      type: ToasterType.ERROR,
                      message: 'Message.Error.Hash-Not-Equal'
                    });
                    throw Error(`hash value not equal: ${hash} != ${hashFromResponse}`);
                  }
                  this.cacheService.setItem(hash, _data);
                  return {hash: hash, data: _data};
                });
              }),
              catchError((err) => {
                LoggingUtil.error(err);
                return this.getMultiDataFromStorage(hashes, numberOfTries + 1, start);
              })
            );
          })
        );
      }));
  }

  public getMultipleUsersByAddresses(listOfUsers: [string[], string[], number[]]): Observable<User[]> {
    const [claimAddresses, claimHashes, roles] = listOfUsers;
    return this.getJsonMultiData(claimHashes).pipe(
      map((membershipClaims: StorageClaim[]) => {
        const users: User[] = [];
        for (let i = 0; i < membershipClaims.length; i++) {
          users.push({
            address: claimAddresses[i],
            claimHash: claimHashes[i],
            resolvedClaim: {
              ...membershipClaims[i]
            } as ResolvedClaim,
            role: new Role(roles[i])
          });
        }
        return users;
      }),
      catchError((err) => {
        LoggingUtil.error(err);
        return of([]);
      })
    );
  }

  // Save Methods
  public saveJsonData(jsonData: StorageData): Observable<string> {
    return this.saveDataToStorage(JSON.stringify(jsonData));
  }

  public saveBlobData(file: Blob): Observable<string> {
    return this.blobToDataURI(file)
      .pipe(mergeMap((jsonData) => {
        if (!jsonData) {
          return of('0x0000000000000000000000000000000000000000000000000000000000000000');
        }
        return this.saveDataToStorage(jsonData);
      }));
  }

  saveJsonMultiData(jsonData: StorageData[]): Observable<string[]> {
    const data: StorageDTO[] = jsonData
      .map(json => {
        const string = JSON.stringify(json);
        const hash = this.cryptoFacade.getKeccak256(string);
        return {'hash': hash, 'data': string};
      });

    return this.saveMultiDataToStorage(data);
  }

  private saveDataToStorage(data: string, numberOfTries: number = 0, start?: number): Observable<string> {
    return this.signatureService.createSignature(false).pipe(
      switchMap((signature: SignatureModel) => {
          return this.getAllStorageServer().pipe(
            concatMap((servers: StorageServer[]) => {
              if (numberOfTries === 0) {
                start = Math.floor(Math.random() * servers.length);
              }
              const index = (start + numberOfTries) % servers.length;
              if (index === start && numberOfTries > 0) {
                throw Error('Could not save data to any server');
              }
              const url = servers[numberOfTries].url;
              const hash: string = this.cryptoFacade.getKeccak256(data);
              const customHeaders = this.signatureService
                .appendSignatureToHttpRequest(this.commonHttpHeaders, signature)
                .set('Content-Type',  'application/json');

              const body = JSON.stringify([{'hash': hash, 'data': data}]);

              return this.http.post(
                url + ENDPOINT_STORAGE_SAVE,
                body,
                {
                  headers: customHeaders,
                  responseType: 'text'
                }
              ).pipe(
                timeout(this.REQUEST_TIMEOUT),
                map(() => {
                  this.cacheService.setItem(hash, data);
                  return hash;
                }),
                catchError((err) => {
                  LoggingUtil.error(err);
                  if (err.status === 413) { throw Error('Data exceeds maximum size and could not be saved'); }
                  return this.saveDataToStorage(data, numberOfTries + 1, start);
                })
              );
            })
          );
        }
      )
    );
  }


  private saveMultiDataToStorage(data: StorageDTO[], numberOfTries: number = 0, start?: number): Observable<string[]> {
    return this.signatureService.createSignature(false).pipe(
      switchMap((signature: SignatureModel) => {
          return this.getAllStorageServer().pipe(
            concatMap((servers: StorageServer[]) => {
              if (numberOfTries === 0) {
                start = Math.floor(Math.random() * servers.length);
              }
              const index = (start + numberOfTries) % servers.length;
              if (index === start && numberOfTries > 0) {
                throw Error('Could not save data to any server');
              }
              const url = servers[numberOfTries].url;
              const customHeaders = this.signatureService
                .appendSignatureToHttpRequest(this.commonHttpHeaders, signature)
                .set('Content-Type',  'application/json');

              const body = JSON.stringify(data);

              return this.http.post(
                url + ENDPOINT_STORAGE_SAVE,
                body,
                {
                  headers: customHeaders,
                  responseType: 'text'
                }
              ).pipe(
                timeout(this.REQUEST_TIMEOUT),
                mergeMap(() => {
                  data.forEach(dto => this.cacheService.setItem(dto.hash, dto.data));
                  return of(data.map(dto => dto.hash));
                }),
                catchError((err) => {
                  LoggingUtil.error(err);
                  return this.saveMultiDataToStorage(data, numberOfTries + 1, start);
                })
              );
            })
          );
        }
      )
    );
  }

  // Utility
  private static dataURItoBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], {type: mimeString});
  }

  private blobToDataURI(file: Blob): Observable<string> {
    if (!file) {
      return of('');
    }

    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);

    const fileReaderPromise$ = from(new Promise((resolve) => {
      fileReader.onloadend = resolve;
    }));

    return fileReaderPromise$.pipe(
      map(() => {
        return fileReader.result as string;
      })
    );
  }

  private getAllStorageServer(): Observable<StorageServer[]> {
    return this.storageUrls$.pipe(
      tap(val => {
        if (val === null) {
          this.store.dispatch(core.LoadStorageUrlsAction());
        }
      }),
      filter(val => val !== null && val.length > 0),
    );
  }

  private getAllStorageServersShuffled() {
    return this.getAllStorageServer().pipe(map(servers => {
      this.shuffleArray(servers);
      return servers;
    }));
  }

  private shuffleArray<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

}
