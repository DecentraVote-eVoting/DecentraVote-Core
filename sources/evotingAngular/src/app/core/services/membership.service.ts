/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {map} from 'rxjs/operators';
import {OrganizationContractService} from './organization-contract.service';
import {BehaviorSubject} from 'rxjs';
import {EthersService} from '@core/services/ethers.service';
import {Wallet} from 'ethers';
import {MeetingModel} from '@meeting/models/meeting.model';
import {UserFacade} from '@user/services/user.facade';
import {Role} from '@user/models/role.model';
import {Observable} from "rxjs/Observable";

@Injectable({
  providedIn: 'root'
})
export class MembershipService {
  private isDirector = new BehaviorSubject<boolean>(false);
  private isGuest = new BehaviorSubject<boolean>(false);
  private isMember = new BehaviorSubject<boolean>(false);

  userIsDirector = this.isDirector.asObservable();
  userIsGuest = this.isGuest.asObservable();
  userIsMember = this.isMember.asObservable();

  constructor(private ethersService: EthersService,
              private organizationContractService: OrganizationContractService,
              private userFacade: UserFacade) {

    this.userFacade.getMyRoleFromStoreOrContract().pipe(
      map((role: Role) => {
        this.isDirector.next(role.isRole(Role.DIRECTOR));
        this.isMember.next(role.isRole(Role.MEMBER));
        this.isGuest.next(role.isRole(Role.GUEST));
      })
    ).subscribe();
  }

  isChairperson(meeting: MeetingModel) {
    return meeting.chairperson === (this.ethersService.signer.signer as Wallet).address;
  }

  isUserGuest(): Observable<boolean> {
    return this.userIsGuest;
  }
}
