/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {first, takeUntil, timeout} from 'rxjs/operators';
import {interval, Subject} from 'rxjs';
import {LoggingUtil} from '@core/utils/logging.util';
import {ROUTE_PATHS} from '@app/route-paths';
import {EthersService} from '@core/services/ethers.service';
import {fromPromise} from 'rxjs/internal-compatibility';
import {TRANSACTION_STATUS_OK} from '@core/models/common.model';
import {Store} from '@ngrx/store';
import {State} from '@app/app.store';
import {UserFacade} from "@app/user/services/user.facade";

@Component({
  selector: 'app-loading-eth',
  templateUrl: './loading-eth.component.html'
})
export class LoadingEthComponent implements OnInit, OnDestroy {

  private unsubscribe$ = new Subject();
  private transactionHash: string;

  constructor(private ethersService: EthersService,
              private store: Store<State>,
              private route: ActivatedRoute,
              private router: Router,
              private memberFacade: UserFacade) {
    this.route.queryParams
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(params => {
        this.transactionHash = params['transactionHash'] || null;
      });
  }

  private interval$ = interval(1000);

  ngOnInit() {
    if (this.transactionHash !== null) {
      this.interval$
        .pipe(timeout(1100), takeUntil(this.unsubscribe$))
        .subscribe(_ => {

          fromPromise(this.ethersService.provider.getTransactionReceipt(this.transactionHash))
            .pipe(first())
            .subscribe(receipt => {
                if (receipt && receipt.status === TRANSACTION_STATUS_OK) {
                  this.memberFacade.loadUsers();
                  this.router.navigate([ROUTE_PATHS.MEETING_OVERVIEW.valueOf()]).catch(_ => console.warn('Could not navigate to route'));
                }
              },
              err => {
                LoggingUtil.error('TransactionHash Invalid. Failed.' + '\n' + err);
                this.router.navigate([ROUTE_PATHS.LOGIN.valueOf()]).catch(_ => console.warn('Could not navigate to route'));
              });
        });
    }
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
