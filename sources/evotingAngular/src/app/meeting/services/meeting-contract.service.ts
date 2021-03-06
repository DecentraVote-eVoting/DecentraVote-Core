/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import contractAbi
  from '../../../../../solidity/target/generated/abi/com.iteratec.evoting.solidity.contracts/GeneralMeeting.json';
import {EthersService} from '@core/services/ethers.service';
import {Contract, Overrides} from 'ethers';
import {MeetingDto} from '@meeting/models/meeting.model';
import {EnvironmentService} from '@core/services/environment.service';
import {from} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MeetingContractService {

  private contractMapping: Contract[] = [];
  private overrides: Overrides = {
    gasPrice: this.env.config().gasPrice,
    gasLimit: this.env.config().gasLimit
  };

  constructor(private ethersService: EthersService, private env: EnvironmentService) {
  }

  getContract(meetingAddress: string): Contract {
    if (!this.contractMapping[meetingAddress]) {
      this.contractMapping[meetingAddress] = new Contract(meetingAddress, contractAbi, this.ethersService.signer);
    }
    return this.contractMapping[meetingAddress];
  }

  getMeetingDto(meetingAddress: string): Observable<MeetingDto> {
    return from<Promise<MeetingDto>>(
      this.getContract(meetingAddress).getMeetingDto()
    );
  }

  createVote(meetingAddress: string, votingOptions: string[], dataHash: string,
             attachmentHash, anonymousVoting: boolean) {
    return from(
      this.getContract(meetingAddress).createVote(dataHash, attachmentHash, votingOptions, anonymousVoting, this.overrides));
  }

  promiseToVote(meetingAddress: string, secretHash: number) {
    return from(
      this.getContract(meetingAddress).registerForGeneralMeeting(secretHash.toString(), { ...this.overrides, gasLimit: 4000000 })
    );
  }

  handoverMandate(meetingAddress: string, representative: string, representedMember: string) {
    return from(this.getContract(meetingAddress)
      .grantRepresentation(representedMember, representative, this.overrides)
    );
  }

  removeMandate(meetingAddress: string, representedMember: string) {
    return from(this.getContract(meetingAddress)
      .removeRepresentative(representedMember, this.overrides)
    );
  }

  deleteVote(meetingAddress: string, voteAddress: string) {
    return from(
      this.getContract(meetingAddress).removeVote(voteAddress)
    );
  }

  changeMeetingDetails(meetingAddress: string, entityAddress: string, startDate: Date, endDate: Date, metaDataHashValue: string) {
    return from(this.getContract(meetingAddress).changeMeetingDetails(
      entityAddress,
      Math.round(startDate.getTime() / 1000),
      Math.round(endDate.getTime() / 1000),
      metaDataHashValue,
      this.overrides
      )
    );
  }

  getVoteAddressesFromMeeting(meetingAddress: string): Observable<string[]> {
    return from<Promise<string[]>>(
      this.getContract(meetingAddress).getVotes()
    );
  }

  toggleMeetingVisibility(meetingAddress: string) {
    return from(
      this.getContract(meetingAddress).toggleVisibility(this.overrides)
    );
  }

  openRegistration(address: any) {
    return from(
      this.getContract(address).openRegistration(this.overrides)
    );
  }

  closeRegistrationStage(meetingAddress: string) {
    return from(
      this.getContract(meetingAddress).closeRegistration(this.overrides)
    );
  }

  openMeeting(meetingAddress: string) {
    return from(
      this.getContract(meetingAddress).openMeeting(this.overrides)
    );
  }

  closeMeeting(meetingAddress: string) {
    return from(
      this.getContract(meetingAddress).closeMeeting(this.overrides)
    );
  }

  changeVoteOrder(meetingAddress: string, voteAddresses: string[]) {
    return from(
      this.getContract(meetingAddress).changeVoteOrder(voteAddresses, this.overrides)
    );
  }

  getHashedSecrets(meetingAddress: string, memberAddresses: string[]) {
    return from(
      this.getContract(meetingAddress).getHashedSecrets(memberAddresses, this.overrides)
    );
  }
}
