/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {concatMap, tap} from 'rxjs/operators';
import * as core from '@core/+state/core.actions';
import {MeetingState} from '@meeting/+state/meeting.reducer';
import * as fromCore from '@core/+state/core.reducer';
import {select, Store} from '@ngrx/store';
import {Observable, of} from 'rxjs';
import {OrganizationContractService} from '@core/services/organization-contract.service';
import {EthersService} from '@core/services/ethers.service';
import {Router} from '@angular/router';
import {ROUTE_PATHS} from '@app/route-paths';
import {SessionStorageUtil} from '@core/utils/session-storage.util';

@Injectable({
  providedIn: 'root'
})
export class OrganizationFacade {

  constructor(private store: Store<MeetingState>,
              private ethersService: EthersService,
              private organizationContractService: OrganizationContractService,
              private router: Router) {
  }

  /**
   * returns mnemonic from session storage
   * @return {Observable<string>}
   */
  getMnemonic(): Observable<string> {
    const mnemonic = SessionStorageUtil.getMnemonic();
    if (!mnemonic) {
      this.router.navigate([ROUTE_PATHS.SETUP.valueOf()]).catch(_ => console.warn('Could not navigate to route'));
    }
    return of(mnemonic);
  }

  /**
   * returns authority options
   * @param {boolean = false} refresh
   * @return {Observable<Observable<string[]>}
   */
  getAuthOptions(refresh: boolean = false): Observable<string[]> {
    return this.store.pipe(
      select(fromCore.getAuthOptions),
      concatMap((value, requestCount) => requestCount === 0 ?
        of(value).pipe(tap((items: string[]) => {
          if (!items || items.length === 0 || refresh) {
            this.store.dispatch(core.GetAuthOptionsAction());
          }
        })) : of(value))
    );
  }

}
