/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {VoteStage} from '@voting/models/vote-stage.enum';
import {BigNumber} from 'ethers';
import {StorageVotingOption} from '@core/models/storage.model';

export interface VoteDto {
  parentGeneralMeeting: string;
  metadataHash: string;
  attachmentHash: string;
  optionHashes: string[];
  reasonHash: string;
  treeHash: string;
  isAnonymous: boolean;
  stage: VoteStage;
  root: BigNumber;
  index: BigNumber;
  chairpersonPublicKey: string[];
  chairpersonPrivateKey: BigNumber;
  excludedList: string[];
  leaves: BigNumber[];
  openedAtBlock: BigNumber;
  closedAtBlock: BigNumber;
}

export interface VoteModel extends VoteDto {
  address: string;
}

export interface VoteCardModel {
  address: string;
  meetingAddress: string;
  title: string;
  description: string;
  isAnonymous: boolean;
  stage: VoteStage;
  numberOfTotalVoteRights: number;
  numberOfOwnVoteRights: number;
  numberOfTotalVotesCast: number;
  numberOfOwnVotesCast: number;
  anonRegisteredAccounts: number;
  ownVoteOptions: string[];
}

export interface VoteDetailModel extends VoteCardModel {
  result?: VoteResult[];
  externalChange?: boolean;
  anonymousAccountsRegistered?: string[];
  attachment?: File;
  filename?: string;
  archiveReason?: string;
  voteOptions?: StorageVotingOption[];
}

export interface CreateVoteModel {
  address: string;
  meetingAddress: string;
  title: string;
  description: string;
  isAnonymous: boolean;
  attachment?: File;
  filename?: string;
  voteOptions?: StorageVotingOption[];
}

export interface VotePermissionModel {
  stage: VoteStage;
  isAnonymous: boolean;
}

export interface AnonymousRoot {
  _hex?: string;
  _isBigNumber?: boolean;
}

export interface VoteResult {
  name?: string;
  value?: number;
}

export class VoteOption {
  static readonly JA: StorageVotingOption = {value: 'Voting.Option.Yes'};
  static readonly NEIN: StorageVotingOption = {value: 'Voting.Option.No'};
  static readonly ENTHALTUNG: StorageVotingOption = {value: 'Voting.Option.Abstention'};

  static readonly LIST: StorageVotingOption[] = [
    VoteOption.JA,
    VoteOption.NEIN,
    VoteOption.ENTHALTUNG
  ];
}

export class AnonParameter {
  anonymous: any;
  root: any;
  index: any;
  nullifier: any;
  secret: any;
  merkle: any;
  direction: any;
}

export class ExportVoteResult {
  title: string;
  description: string;
  attachmentFileName: string;
  attachmentHash: string;
  options: string[];
  userResults: UserResult[];
}

export class UserResult {
  name1: string;
  name2: string;
  uid: string;
  ethAddress: string;
  options: string[];
}

export class VoteDetailTab {
  static readonly RESULT_OVERVIEW: number = 1;
  static readonly RESULT_LIST: number = 2;
}

export class VoteResultSorting {
  static readonly BY_OPTIONS: number = 1;
  static readonly BY_USERS: number = 2;
}
