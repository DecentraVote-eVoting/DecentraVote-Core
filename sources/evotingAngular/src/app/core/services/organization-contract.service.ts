/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import contractAbi
  from '../../../../../solidity/target/generated/abi/com.iteratec.evoting.solidity.contracts/Organization.json';
import {Observable} from 'rxjs/Observable';
import {from, ReplaySubject} from 'rxjs';
import {Contract, Overrides} from 'ethers';
import {EthersService} from '@core/services/ethers.service';
import {take, tap} from 'rxjs/operators';
import {EnvironmentService} from '@core/services/environment.service';

@Injectable({
  providedIn: 'root'
})
export class OrganizationContractService {
  contract: Contract;

  contract$ = new ReplaySubject<Contract>();
  private overrides: Overrides = {
    gasPrice: this.env.config().gasPrice,
    gasLimit: this.env.config().gasLimit
  };

  constructor(private ethersService: EthersService, private env: EnvironmentService) {
    this.ethersService.getProviderIfReady().pipe(
      take(1),
      tap(provider => {
        if (!this.contract) {
          this.contract = new Contract(this.env.getOrganizationAddress(), contractAbi, provider);
          this.contract$.next(this.contract);
        }
      })
    ).subscribe();

    this.ethersService.getSignerIfReady().pipe(
      tap(signer => {
        this.contract = new Contract(this.env.getOrganizationAddress(), contractAbi, signer);
      })
    ).subscribe();
  }

  getContract() {
    return this.contract;
  }

  getContractIfReady(): Observable<Contract> {
    return this.contract$;
  }

  loadStorageUrls(): Observable<any> {
    return from(this.getContract().getStorageServiceList());
  }

  loadBallotBoxUrls(): Observable<any> {
    return from(this.getContract().getBallotboxServiceList());
  }

  getMeetings(): Observable<string[]> {
    return from<Promise<string[]>>(this.getContract().getGeneralMeetingList());
  }

  createMeeting(startDate: Date, endDate: Date, chairpersonAddress: string, metaDataHash: string): Observable<string> {
    return from<Promise<string>>(this.getContract().createNewGeneralMeeting(
      Math.round(startDate.getTime() / 1000),
      Math.round(endDate.getTime() / 1000),
      chairpersonAddress,
      12, // Merkle Tree Levels
      metaDataHash,
      this.overrides
    ));
  }

  removeMeeting(entityAddress: string) {
    return from(this.getContract().removeGeneralMeeting(entityAddress, this.overrides));
  }

  getUserRole(entityAddress: string): Observable<number> {
    return from<Promise<number>>(this.getContract().getUserRole(entityAddress));
  }

  editUser(entityAddress: string, claimHash: string, roleNumber: number): Observable<boolean> {
    return from<Promise<boolean>>(this.getContract().editUser(entityAddress, claimHash, roleNumber));
  }

  listOfUser(): Observable<[string[], string[], number[]]> {
    return from<Promise<[string[], string[], number[]]>>(this.getContract().getUser());
  }

  nextIndexForRoot(root: string): Observable<number> {
    return from<Promise<number>>(this.getContract().nextIndexForRoot(root));
  }

  isAccountRegisteredForRootAndIndex(root: string, index: number, account: string): Observable<number> {
    return from<Promise<number>>(this.getContract().isAccountRegisteredForRootAndIndex(root, index, account));
  }

  eventManager(): Observable<string> {
    return from<Promise<string>>(this.contract.eventManager());
  }
}
