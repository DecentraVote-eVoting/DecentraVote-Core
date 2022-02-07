/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {ethers, Wallet} from 'ethers';
import {BaseProvider} from '@ethersproject/providers/lib/base-provider';
import {BehaviorSubject, Observable} from 'rxjs';
import {filter, map, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {NonceManager} from '@ethersproject/experimental';
import {RetryProvider} from '@core/utils/ethers/retry-provider';
import {ToasterService} from '@core/services/toaster.service';
import {SolidityErrorPipe} from '@core/pipes/solidity-error.pipe';
import {Networkish} from '@ethersproject/networks';

@Injectable({
  providedIn: 'root'
})
export class EthersService {

  private _provider: BaseProvider;
  private _signer: NonceManager;

  private _anonymousWallets: NonceManager[] = [];

  private signerReadySubject = new BehaviorSubject(false);
  private providerReadySubject = new BehaviorSubject(false);
  private isReadySubject = new BehaviorSubject(false);

  readonly isReady = this.isReadySubject.pipe(filter(val => val === true));

  constructor(
    private solidityErrorPipe: SolidityErrorPipe,
    private toasterService: ToasterService
  ) {
    this.signerReadySubject.pipe(
      withLatestFrom(this.providerReadySubject),
      map(([signerReady, providerReady]) => {
        return signerReady && providerReady;
      }),
      filter(rdy => rdy === true),
      tap((_) => {
        this.isReadySubject.next(true);
      })
    ).subscribe();
  }

  createSigner(mnemonic: string) {
    this.providerReadySubject.pipe(
      filter(rdy => rdy === true),
      tap(() => {
        const wallet = ethers.Wallet.fromMnemonic(mnemonic).connect(this.provider);
        this._signer = new NonceManager(wallet);
        this.addAnonymousSigner(this._signer);
        this.signerReadySubject.next(true);
      })
    ).subscribe();
  }

  createProvider(url: string, network: Networkish) {
    this._provider = new RetryProvider(10, url, this.toasterService, this.solidityErrorPipe, network);
    this.providerReadySubject.next(true);
  }

  getProviderIfReady(): Observable<BaseProvider> {
    return this.providerReadySubject.pipe(
      filter(rdy => rdy),
      map(_ => this._provider)
    );
  }

  getSignerIfReady(): Observable<NonceManager> {
    return this.isReady.pipe(
      map(_ => this._signer)
    );
  }

  getSignerAddress(): Observable<string> {
    return this.getSignerIfReady().pipe(
      switchMap(signer => {
        return Observable.fromPromise(signer.getAddress());
      })
    );
  }

  get provider(): BaseProvider {
    return this._provider;
  }

  get signer(): NonceManager {
    return this._signer;
  }

  addAnonymousSigner(nonceManager: NonceManager) {
    this._anonymousWallets[(nonceManager.signer as Wallet).address] = nonceManager.connect(this.provider);
  }

  getAnonymousSigner(address: string): NonceManager {
    return this._anonymousWallets[address];
  }
}
