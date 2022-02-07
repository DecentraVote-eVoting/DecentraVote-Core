/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {User, UserTab} from '@app/user/models/user.model';
import {OrganizationFacade} from '@core/services/organization.facade.service';
import {Observable, Subject} from 'rxjs';
import {first, switchMap, takeUntil} from 'rxjs/operators';
import {MembershipService} from '@core/services/membership.service';
import {UserFacade} from '@app/user/services/user.facade';
import {ImportUserFacade} from '@import-user/services/import-user.facade';
import {ImportUser} from '@import-user/models/import-user.model';
import {EthersService} from '@core/services/ethers.service';

@Component({
  selector: 'app-user-overview-smart',
  template: `
    <app-user-overview   [user]="user"
                         [users]="users"
                         [importedUsers]="importedUsers"
                         [usersLoading]="usersLoading"
                         [authOptions]="authOptions"
                         [userIsDirector]="userIsDirector$ | async">
    </app-user-overview>`
})
export class UserOverviewSmartComponent implements OnInit, OnDestroy {
  users: User[] = [];
  importedUsers: ImportUser[] = [];
  usersLoading: boolean;
  authOptions: string[] = [];
  userIsDirector$: Observable<boolean>;
  activeTab: UserTab = UserTab.MEMBER;
  user: User;

  private unsubscribe$ = new Subject();

  constructor(private organizationFacade: OrganizationFacade,
              private cdr: ChangeDetectorRef,
              private membershipService: MembershipService,
              private importUserFacade: ImportUserFacade,
              private memberFacade: UserFacade,
              private ethersService: EthersService,
              private userFacade: UserFacade) {
    this.userIsDirector$ = this.membershipService.userIsDirector;
  }

  ngOnInit() {
    this.organizationFacade.getAuthOptions()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(options => {
        this.authOptions = options;
        this.cdr.detectChanges();
      });

    this.memberFacade.getValidUsers().pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
      (users) => {
        this.users = users;
        this.cdr.detectChanges();
      });

    this.memberFacade.getIsUserLoading()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(usersLoading => {
        this.usersLoading = usersLoading;
        this.cdr.detectChanges();
      });

    this.importUserFacade.getImportedUsers()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(importedUsers => {
        this.importedUsers = importedUsers;
        this.cdr.detectChanges();
      });

    this.ethersService.getSignerAddress()
      .pipe(first(),
        switchMap((address: string) => {
          return this.userFacade.getUserByAddress(address);
        }))
      .subscribe(user => this.user = user);
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onTabChange(tab: UserTab) {
    this.activeTab = tab;
  }

}
