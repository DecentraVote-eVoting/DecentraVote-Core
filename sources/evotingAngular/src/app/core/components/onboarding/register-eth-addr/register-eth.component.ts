/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {first, tap} from 'rxjs/operators';
import {LoggingUtil} from '@core/utils/logging.util';
import {ROUTE_PATHS} from '@app/route-paths';
import {EthersService} from '@core/services/ethers.service';
import {fromPromise} from 'rxjs/internal-compatibility';
import {OracleService} from '@core/services/oracle.service';
import {Store} from '@ngrx/store';
import {State} from '@app/app.store';
import {ToasterType} from '@core/models/toaster.model';
import * as core from '@core/+state/core.actions';
import {OrganizationFacade} from '@core/services/organization.facade.service';
import {CryptoFacade} from '@core/services/crypto.facade';
import {jwtUser} from '@app/user/models/user.model';

@Component({
  selector: 'app-register-eth',
  templateUrl: './register-eth.component.html'
})
export class RegisterEthComponent {

  currentAddress: string;
  user: jwtUser;
  connectLoading = false;

  constructor(private router: Router,
              private ethersService: EthersService,
              private oracleService: OracleService,
              private route: ActivatedRoute,
              private store: Store<State>,
              private organizationFacade: OrganizationFacade,
              private cryptoFacade: CryptoFacade) {

    this.organizationFacade.getMnemonic()
      .pipe(first())
      .subscribe(mnemonic => {
        if (!this.ethersService.signer) {
          this.ethersService.createSigner(mnemonic);
        }
      });

    this.ethersService.getSignerIfReady().pipe(
      first(),
      tap(() => {
        fromPromise(this.ethersService.signer.getAddress())
          .pipe(first())
          .subscribe(address => this.currentAddress = address);
      })
    ).subscribe();

    this.oracleService.whoAmI().subscribe(
      (user: jwtUser) => {
        this.user = user;
      }
    );
  }

  onConnectClicked() {
    this.connectLoading = true;

    this.cryptoFacade.getSecretHash()
      .pipe(first())
      .subscribe(secretHash => {
        this.oracleService.registerMember(this.currentAddress, secretHash)
          .pipe(first())
          .subscribe((transactionHash: string) => {
            LoggingUtil.info('Transaction Hash: ', transactionHash);
            this.connectLoading = false;
            this.router.navigate([ROUTE_PATHS.LINK_ETH_ADDRESS.valueOf()],
              {
                queryParams: {
                  transactionHash: transactionHash
                }
              }).catch(_ => console.warn('Could not navigate to route'));
          }, error => {
            document.cookie = 'evoting-access= ; expires = Thu, 01 Jan 1970 00:00:00 GMT';
            this.store.dispatch(core.NotificationAction({
              level: ToasterType.ERROR,
              message: 'Message.Error.Register-Eth',
              err: error
            }));
            LoggingUtil.error(error);
            this.connectLoading = false;
            this.router.navigate([ROUTE_PATHS.LOGIN]).catch(_ => console.warn('Could not navigate to route'));
          });
      });
  }

}
