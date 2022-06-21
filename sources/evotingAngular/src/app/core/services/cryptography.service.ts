/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {from, Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {EthersService} from '@core/services/ethers.service';
import {ethers} from 'ethers';
import * as circomlib from 'circomlib';
import * as ffj from 'ffjavascript';
import {AnonParameter} from '@voting/models/vote.model';

const g1 = [BigInt('1'), BigInt('2'), BigInt('1')];

@Injectable({
  providedIn: 'root'
})
export class CryptographyService {

  constructor(private ethersService: EthersService) {
  }

  privateKeyToPublicKey(privateKey: bigint): bigint[] {
    return ffj.bn128.G1.mulScalar(g1, privateKey);
  }

  publicKeyToString(publicKey) {
    publicKey = [BigInt(publicKey[0]), BigInt(publicKey[1]), BigInt(publicKey[2])];
    return '[' + ffj.bn128.G1.affine(publicKey).toString().slice(0, -2) + ']';
  }

  affinePublicKey(publicKey: bigint[]): bigint[] {
    publicKey = [BigInt(publicKey[0]), BigInt(publicKey[1]), BigInt(publicKey[2])];
    publicKey = ffj.bn128.G1.affine(publicKey);
    return [publicKey[0], publicKey[1]];
  }

  unaffinePublicKey(publicKey: bigint[]): bigint[] {
    return [publicKey[0], publicKey[1], BigInt(1)];
  }

  generateVote(privateKey: bigint, publicKey: bigint[], value: number): bigint {
    let h = this.getBaseVote(privateKey, publicKey);
    for (let i = 0; i < value; i++) {
      h = this.increaseVoteByOne(h);
    }
    return h;
  }

  getBaseVote(privateKey: bigint, publicKey: bigint[]): bigint {
    publicKey = [publicKey[0], publicKey[1], publicKey[2]];
    const p = ffj.bn128.G1.mulScalar(publicKey, privateKey);
    const pAffine = this.affinePublicKey(p);
    return circomlib.mimcsponge.multiHash([pAffine[0], pAffine[1]], BigInt(0), BigInt(1));
  }

  increaseVoteByOne(h: bigint): bigint {
    return circomlib.mimc7.hash(h, 0);
  }

  generateDeterministicPrivateKey(params: string): string {
    return this.keccak256(params);
  }

  keccak256(params: string): string {
    return ethers.utils.keccak256([...Buffer.from(params)]);
  }

  generateNullifier(root: bigint, secret: bigint, index: bigint) {
    const secretRootHash = circomlib.mimcsponge.multiHash([secret.toString(), root.toString()], 0, 1);
    return circomlib.mimcsponge.multiHash([secretRootHash.toString(), index.toString()], 0, 1);
  }

  generateSercretHash(secret: string) {
    return circomlib.mimc7.hash(secret, 0);
  }

  generateSecret(): Observable<string> {
    return this.ethersService.getSignerIfReady().pipe(
      switchMap(signer => {
        return from<Promise<any>>(signer.signMessage('THIS SINGATURE IS USED BY DECENTRAVOTE EXCLUSIVELY. DO NOT SIGN THIS MESSAGE ANYWHERE ELSE.'));
      }),
      map(signature => {
        return circomlib.mimc7.hash(signature, 0).toString();
      })
    );
  }

  merkleParent(leftHash: bigint, rightHash: bigint) {
    return circomlib.mimcsponge.multiHash([leftHash.toString(), rightHash.toString()], 0, 1);
  }

  merkleProof(secret: bigint, pos: number, leaves: bigint[], treeLevel: number) {
    let index = 0;
    const leaveStrings = leaves
      .map(element => element.toString());
    const leafToSearch = this.generateSercretHash('0x' + secret.toString(16)).toString();
    for (let i = 0; ((i <= pos) && (index !== -1)); i++) {
      index = leaveStrings.indexOf(leafToSearch, index) + 1;
    }
    if (index === -1) {
      return 0;
    } else {
      return this.merkleProofAtPos(index - 1, leaves, treeLevel);
    }
  }

  merkleProofAtPos(pos: number, leaves: bigint[], treeLevel: number) {
    if (pos >= leaves.length) {
      return 0;
    }
    const merkle: bigint[] = [];
    const direction: Array<string> = [];
    // let zero = merkleLeaf(0);
    let zero = BigInt(0);
    for (let level = 0; level < treeLevel; level++) {
      const hash: bigint[] = [];
      if (leaves.length % 2 === 1) {
        leaves.push(zero);
      }
      for (let i = 0; i < leaves.length / 2; i++) {
        if (pos === 2 * i) {
          merkle.push(leaves[2 * i + 1]);
          direction.push('0');
        } else if (pos === 2 * i + 1) {
          merkle.push(leaves[2 * i]);
          direction.push('1');
        }
        hash.push(this.merkleParent(leaves[2 * i], leaves[2 * i + 1]));
      }
      leaves = hash.slice();
      zero = this.merkleParent(zero, zero);
      pos = Math.floor(pos / 2);
    }
    return [leaves[0], merkle, direction];
  }

  calcProofInput(address: string, secret: bigint, pos: number, leaves: bigint[], index: bigint, treeLevel: number): AnonParameter {
    const p: 0 | Array<any> = this.merkleProof(secret, pos, leaves, treeLevel);
    if (p === 0) {
      return null;
    }
    let indexext = index;
    for (let i = 0; i < p[2].length; i++) {
      indexext = indexext + (BigInt(p[2][i]) * (2n ** (128n + BigInt(i))));
    }
    const root = p[0].toString();
    return {
      'anonymous': address,
      'root': root,
      'index': index.toString(),
      'nullifier': this.generateNullifier(BigInt(root), secret, indexext).toString(),
      'secret': secret.toString(),
      'merkle': p[1].map(element => element.toString()),
      'direction': p[2]
    };
  }

}
