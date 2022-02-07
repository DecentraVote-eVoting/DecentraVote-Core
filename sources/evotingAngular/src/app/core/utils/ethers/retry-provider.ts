/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ConnectionInfo, poll} from '@ethersproject/web';
import {ethers} from 'ethers';
import {Networkish} from '@ethersproject/networks';
import {ToasterService} from '@core/services/toaster.service';
import {ToasterType} from '@core/models/toaster.model';
import {SolidityErrorPipe} from '@core/pipes/solidity-error.pipe';

export class RetryProvider extends ethers.providers.StaticJsonRpcProvider {
  constructor(
    attempts: number,
    url: ConnectionInfo | string,
    private service: ToasterService,
    private solidityErrorPipe: SolidityErrorPipe,
    network?: Networkish
  ) {
    super(url, network);
    this.attempts = attempts;
  }

  public attempts: number;

  public perform(method: string, params: any) {
    let attempts = 0;
    return poll(() => {
      attempts++;
      return super.perform(method, params).then(
        (result) => result,
        (error) => {
          let errorMessage = this.solidityErrorPipe.transform(error);
          switch (error.reason) {
            case 'missing response':
              console.warn('Network seems to be offline, attempt: ' + attempts);
              if (attempts < this.attempts) { break; }

              console.error('Your Network was down for too long!');
              this.service.addToaster({
                type: ToasterType.ERROR,
                message: 'Message.Error.Timeout'
              });
              break;
            default:
              if (!errorMessage) {
                errorMessage = error.error.message;
              }
              return Promise.reject(errorMessage);
          }
        }
      );
    });
  }
}
