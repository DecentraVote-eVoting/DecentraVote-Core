/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {EthersService} from '@core/services/ethers.service';
import {concatMap, map, switchMap} from 'rxjs/operators';
import {from, Observable, of, zip} from 'rxjs';
import {NonceManager} from '@ethersproject/experimental';
import {SignatureModel} from '@core/models/signature.model';
import {Ballot, OpenBallotNullifier} from '@core/models/ballot-box.model';


@Injectable({
  providedIn: 'root'
})
export class SignatureService {


  constructor(private ethersService: EthersService) {
  }

  createSignature(publicResource: boolean): Observable<SignatureModel | null> {
    if (publicResource) {
      return of(null);
    }

    return this.ethersService.getProviderIfReady().pipe(
      switchMap((provider) => {
        return from<Promise<number>>(provider.getBlockNumber());
      }),
      concatMap((num: number) => {
        return this.ethersService.getSignerIfReady().pipe(
          switchMap((manager: NonceManager) => {
            return manager.signMessage(num.toString());
          }),
          map((signedMessage: string) => {
            return <SignatureModel>{
              signature: signedMessage,
              message: num.toString()
            };
          })
        );
      })
    );
  }

  signBallots(ballots: Ballot[], anonymousAddress?: string): Observable<SignatureModel[]> {
    const ballotStrings: string[] = ballots.map(ballot => JSON.stringify(ballot));

    let signer$: Observable<NonceManager>;

    if (anonymousAddress) {
      signer$ = of(this.ethersService.getAnonymousSigner(anonymousAddress));
    } else {
      signer$ = this.ethersService.getSignerIfReady();
    }

    return signer$.pipe(
      switchMap((signer) => {
        return zip(...ballotStrings.map(ballotString =>
          from<Promise<string>>(signer.signMessage(ballotString)).pipe(
            map((signedBallot: string) => {
              return <SignatureModel>{
                signature: signedBallot,
                message: ballotString
              };
            })
          ))
        );
      })
    );
  }

  signNullifier(nullifiers: OpenBallotNullifier[]): Observable<SignatureModel[]> {
    const nullifierStrings: string[] = nullifiers.map(nullifier => JSON.stringify(nullifier));

    return this.ethersService.getSignerIfReady().pipe(
      switchMap((signer) => {
        return zip(...nullifierStrings.map(nullifierString =>
          from<Promise<string>>(signer.signMessage(nullifierString)).pipe(
            map((signedBallot: string) => {
              return <SignatureModel>{
                signature: signedBallot,
                message: nullifierString
              };
            })
          ))
        );
      })
    );
  }

  appendSignatureToHttpRequest(headers: HttpHeaders, signature: SignatureModel): HttpHeaders {
    headers = headers.append('Signature', signature.signature);
    headers = headers.append('Message', signature.message);
    headers = headers.append('Public', 'false');
    return headers;
  }
}
