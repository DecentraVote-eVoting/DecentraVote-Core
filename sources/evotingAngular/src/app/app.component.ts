/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs';
import {map, takeUntil, tap} from 'rxjs/operators';
import {State} from './app.store';
import {select, Store} from '@ngrx/store';
import * as core from './core/+state/core.actions';
import {TranslateService} from '@ngx-translate/core';
import {EthersService} from '@core/services/ethers.service';
import * as fromCore from '@core/+state/core.reducer';
import {CacheService} from '@core/services/cache.service';
import {OrganizationContractService} from '@core/services/organization-contract.service';
import {EventManagerService} from '@core/services/event-manager.service';
import {UserFacade} from '@app/user/services/user.facade';
import {EnvironmentService} from '@core/services/environment.service';
import {Role} from '@user/models/role.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnDestroy {

  serverLoading = true;

  private unsubscribe$ = new Subject();

  constructor(private ethersService: EthersService,
              private store: Store<State>,
              private cacheService: CacheService,
              private translateService: TranslateService,
              private organizationContractService: OrganizationContractService,
              private eventManagerService: EventManagerService,
              private userFacade: UserFacade,
              private env: EnvironmentService
  ) {


    console.log('Creating Ether Provider with URL: ' + env.config().httpRpcServer);
    console.log('Frontend is using Organization: ' + env.getOrganizationAddress());
    this.ethersService.createProvider(env.config().httpRpcServer, {
      name: env.getNetwork(),
      chainId: env.config().networkId,
      ensAddress: env.config().ensRegistryAddress
    });
    this.initLanguage();
    this.cacheService.cleanUp();

    this.userFacade.getMyRoleFromStoreOrContract().pipe(
      map((role: Role) => {
        console.log('Initialized Ether Provider: ' + env.config().httpRpcServer);
        if (role.value > Role.NONE.value) {
          this.userFacade.loadUsers();
        }
        this.eventManagerService.subscribeToEventManager();
      })
    ).subscribe();

    this.ethersService.getProviderIfReady().pipe(
      tap(_ => {
        this.store.dispatch(core.LoadStorageUrlsAction());
        this.store.dispatch(core.LoadBallotBoxUrlsAction());
      })
    ).subscribe();

    this.store.pipe(select(fromCore.areServersLoading), takeUntil(this.unsubscribe$))
      .subscribe(loading => {
        this.serverLoading = loading;
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private initLanguage() {
    this.translateService.addLangs(['de', 'en']);
    this.translateService.setDefaultLang('de');
    const browserLang = this.translateService.getBrowserLang();
    this.translateService.use(browserLang.match(/de|en/) ? browserLang : 'en');
  }
}
