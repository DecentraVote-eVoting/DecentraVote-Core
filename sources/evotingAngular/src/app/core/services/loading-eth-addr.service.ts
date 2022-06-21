/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {from, Observable, throwError} from 'rxjs';
import {EthersService} from '@core/services/ethers.service';
import {TransactionReceipt} from '@ethersproject/abstract-provider';
import {tap} from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class LoadingEthAddrService {

  constructor(private ethersService: EthersService) {
  }

  check(trxHash: string): Observable<TransactionReceipt> {
    return from<Promise<any>>(this.ethersService.provider.getTransactionReceipt(trxHash))
      .pipe(tap(receipt => {
          if (receipt === null) {
            throwError('Error with Transaction');
          }
        })
      );
  }
}
