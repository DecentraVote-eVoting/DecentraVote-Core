/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {createSelector, select, Store} from '@ngrx/store';
import * as fromRoot from '@app/app.store';
import * as userActions from '@app/user/+state/user.actions';
import {Observable, of} from 'rxjs';
import {User} from '@app/user/models/user.model';
import {Role} from '@user/models/role.model';
import memoizee from 'memoizee';
import * as userReducer from '@app/user/+state/user.reducer';
import {filter, first, map, shareReplay, switchMap, withLatestFrom} from 'rxjs/operators';
import {deepDistinctUntilChanged} from '@core/utils/pipe.util';
import {EthersService} from "@core/services/ethers.service";
import {Wallet} from "ethers";
import {OrganizationContractService} from "@core/services/organization-contract.service";
import {NonceManager} from "@ethersproject/experimental";

@Injectable({
  providedIn: 'root'
})
export class UserFacade {

  constructor(private store: Store<fromRoot.State>,
              private ethersService: EthersService,
              private organizationContractService: OrganizationContractService) {
  }

  /**
   * returns all users
   * @return {Observable<User[]>}
   */
  getUsers: (() => Observable<User[]>) = memoizee(() => {
    return this.store.pipe(
      map(userReducer.selectors.selectAll),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns all members
   * @return {Observable<User[]>}
   */
  getValidUsers: (() => Observable<User[]>) = memoizee(() => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getUserState,
          userReducer.getValidUsers()
        )
      ),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns all members
   * @return {Observable<User[]>}
   */
  getMembers: (() => Observable<User[]>) = memoizee(() => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getUserState,
          userReducer.getMember()
        )
      ),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns all guests
   * @return {Observable<User[]>}
   */
  getGuests: (() => Observable<User[]>) = memoizee(() => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getUserState,
          userReducer.getGuest()
        )
      ),
      deepDistinctUntilChanged(),
      shareReplay(1)
    );
  });

  /**
   * returns member by address
   * @param {string} memberAddress
   * @return {Observable<User>}
   */
  getUserByAddress: ((string) => Observable<User>) = memoizee((userAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getUserState,
          userReducer.getUserByAddress(userAddress)
        )
      ),
      filter(val => val !== undefined)
    );
  });

  /**
   * returns member by address or undefined
   * @param {string} memberAddress
   * @return {Observable<User>}
   */
  getUserByAddressOrUndefined: ((string) => Observable<User>) = memoizee((userAddress: string) => {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getUserState,
          userReducer.getUserByAddress(userAddress)
        )
      )
    );
  });

  /**
   * returns the user role associated with the logged in signer
   */
  getMyRoleFromStoreOrContract(): Observable<Role> {
    return this.ethersService.signer ?
      this.getMyRoleFromStore((this.ethersService.signer.signer as Wallet).address) :
      this.ethersService.getSignerIfReady().pipe(
      switchMap((signer: NonceManager) => this.getMyRoleFromStore((signer.signer as Wallet).address)),
      first(),
    );
  }

  getMyRoleFromStore(address: string): Observable<Role> {
    return this.getUserByAddressOrUndefined(address).pipe(
      switchMap((user: User) => {
        if (user) {
          return of(user.role);
        }
        return this.getMyRoleFromContract(address);
      })
    );
  }

  getMyRoleFromContract(address: string): Observable<Role> {
    return this.organizationContractService.getUserRole(address).pipe(
      map((role: number) => {
        return new Role(role);
      })
    );
  }

  /**
   * returns the user role associated with the logged in signer
   */
  getUserRoleFromStoreOrContract(): Observable<Role> {
    return this.getUsers().pipe(
      withLatestFrom(this.ethersService.getSignerIfReady()),
      switchMap(([users, signer]: [User[], NonceManager]) => {
        const address = (signer.signer as Wallet).address;
        if (users.filter(user => user.address === address).length === 0) {
          return this.organizationContractService.getUserRole(address)
            .pipe(map((roleNumber: number) => new Role(roleNumber)));
        } else {
          return of(users.find(user => user.address === address).role);
        }
      })
    );
  }

  /**
   * returns true if users are loading
   * @return {Observable<boolean>}
   */
  getIsUserLoading(): Observable<boolean> {
    return this.store.pipe(
      select(
        createSelector(
          fromRoot.getUserState,
          userReducer.getIsUserLoading()
        )
      ),
      filter(val => val !== undefined)
    );
  }

  /**
   * loads all users by dispatching action
   */
  loadUsers() {
    this.store.dispatch(userActions.LoadUsersAction());
  }

  /**
   * invalidates a specific user by dispatching action
   * @param {string} userAddress
   * @param {string} claimHash
   */
  invalidateUser(userAddress: string, claimHash: string) {
    this.store.dispatch(userActions.RemoveUserAction({address: userAddress, claimHash: claimHash}));
  }
}
