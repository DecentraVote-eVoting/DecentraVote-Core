/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of, ReplaySubject} from 'rxjs';
import {catchError, concatMap, map} from 'rxjs/operators';
import {CryptographyService} from './cryptography.service';
import {StorageService} from '@core/services/storage.service';
import {ObjectUtil} from '@core/utils/object.util';
import {AssetFiles} from '@core/models/asset.model';
import {AnonParameter} from '@voting/models/vote.model';
import {BigNumber} from 'ethers';
import {ZKProofDTO} from '@core/models/ballot-box.model';

declare var snarkjs: any;

@Injectable({
  providedIn: 'root'
})
export class ZkProofService {

  private zkey: Buffer;
  private wasm: Buffer;
  private verificationKey: any;

  witnessReady = new ReplaySubject<boolean>();

  constructor(private http: HttpClient,
              private cryptographyService: CryptographyService,
              private storageService: StorageService) {
    this.init();
    this.witnessReady.next(true);
  }

  private init() {
    this.storageService.getData(AssetFiles.ZKEY, true)
      .pipe(map(ObjectUtil.convertToUint8Array))
      .subscribe(result => {
        this.zkey = result;
      });

    this.storageService.getData(AssetFiles.WASM, true)
      .pipe(map(ObjectUtil.convertToUint8Array))
      .subscribe(result => {
        this.wasm = result;
      });

    this.storageService.getData(AssetFiles.VERIFICATION_KEY, true)
      .pipe(map(ObjectUtil.convertJsonFileToObject))
      .subscribe(result => {
        this.verificationKey = result;
      });
  }

  getProofParams(anonymousAddress: string, secret: string, pos: number, leaves: BigNumber[], voteIndex: BigNumber): AnonParameter {
    const secretBigI = BigInt(secret);
    const leavesBigI = leaves.map((element: BigNumber) => {
      return BigInt(element);
    });
    const index: bigint = BigInt(voteIndex);
    return this.cryptographyService.calcProofInput(anonymousAddress, secretBigI, pos, leavesBigI, index, 12);
  }

  createProof(params: AnonParameter): Observable<ZKProofDTO> {
    console.log('fullProve with params');
    // console.log(params);
    return Observable.fromPromise(snarkjs.groth16.fullProve(params, this.wasm, this.zkey)).pipe(
      concatMap(({proof, publicSignals}) => {
        console.log('Request Wasm File');
        this.storageService.getData(AssetFiles.WASM, true)
          .pipe(map(ObjectUtil.convertToUint8Array))
          .subscribe(result => {
            console.log('Got WASM File');
            this.wasm = result;
          });
        return of(<ZKProofDTO>{
          proof: proof,
          publicSignals: publicSignals
        });

      }),
      catchError(err => {
        console.log('Error: ' + err);
        console.log('Error: ' + err.message);
        throw new Error('Something went wrong generating the proof');
      })
    );
  }

  public verifyProof(vkey = this.verificationKey, proof, publicSignals): Observable<boolean> {
    //console.log('verifying Proof');
    return Observable.fromPromise(snarkjs.groth16.verify(vkey, publicSignals, proof));
  }

}
