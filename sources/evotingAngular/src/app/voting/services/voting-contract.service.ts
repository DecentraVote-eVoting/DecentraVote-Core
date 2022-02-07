/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import contractAbi
  from '../../../../../solidity/target/generated/abi/com.iteratec.evoting.solidity.contracts/Vote.json';
import 'rxjs/add/observable/fromPromise';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {EthersService} from '@core/services/ethers.service';
import {Contract, Overrides} from 'ethers';
import {TransactionResponse} from '@ethersproject/abstract-provider';
import {VoteDto, VoteModel} from '@voting/models/vote.model';
import {EnvironmentService} from '@core/services/environment.service';

@Injectable({
  providedIn: 'root'
})
export class VotingContractService {

  private contractMapping: Contract[] = [];
  private overrides: Overrides = {
    gasPrice: this.env.config().gasPrice,
    gasLimit: this.env.config().gasLimit
  };

  constructor(private ethersService: EthersService, private env: EnvironmentService) {
  }

  getContract(address: string): Contract {
    if (!this.contractMapping[address]) {
      this.contractMapping[address] = new Contract(address, contractAbi, this.ethersService.signer);
    }
    return this.contractMapping[address];
  }

  getVoteRaw(votingAddress: string): Observable<VoteModel> {
    return Observable.fromPromise(this.getContract(votingAddress).getVoteDto()).pipe(
      map((vote: VoteDto) => {
        return {...vote, address: votingAddress, selectedVoteOptions: []};
      })
    );
  }

  castVote(votingAddress: string,
           memberAddress: string,
           decisions: bigint[],
           publicKeys: bigint[][],
           isAnonymous: boolean)
    : Observable<string[]> {
    let contract;
    if (isAnonymous) {
      const signer = this.ethersService.getAnonymousSigner(memberAddress);
      contract = this.getContract(votingAddress).connect(signer);
    } else {
      contract = this.getContract(votingAddress);
    }


    return Observable.fromPromise(contract.castVote(
      decisions.map((val) => val.toString()),
      publicKeys.map((val) => val.map(val1 => val1.toString())),
      {
        ...this.overrides,
        gasLimit: +this.env.config().gasLimit / 10
      }
      )
    );
  }

  excludeFromVote(votingAddress: string, addressesToBlock: string[]) {
    return Observable.fromPromise(this.getContract(votingAddress).excludeVoters(addressesToBlock, this.overrides));
  }

  openVoting(votingAddress: string, publicKey, reduced: number[]): Observable<TransactionResponse> {
    return Observable.fromPromise(this.getContract(votingAddress).openVote(publicKey.map(val => val.toString()), reduced, this.overrides));
  }

  closeVoting(votingAddress: string): Observable<TransactionResponse> {
    return Observable.fromPromise(this.getContract(votingAddress).endVote(this.overrides));
  }

  enableTallying(votingAddress: string, privateKey: bigint) {
    return Observable.fromPromise(this.getContract(votingAddress).startCountingVotes(privateKey.toString(), this.overrides));
  }

  archiveVoting(votingAddress: string, reason: string) {
    return Observable.fromPromise(this.getContract(votingAddress).cancelVote(reason, this.overrides));
  }

  setAnonymous(votingAddress: string, anonymous: boolean) {
    return Observable.fromPromise(this.getContract(votingAddress).setAnonymous(anonymous, this.overrides));
  }

  editVote(votingAddress: string, metadata: string, attachmentHash: string, options: string[], anonymous: boolean) {
    return Observable.fromPromise(this.getContract(votingAddress).editVote(metadata, attachmentHash, options, anonymous, this.overrides));
  }
}
