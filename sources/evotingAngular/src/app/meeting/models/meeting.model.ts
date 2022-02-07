/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {BigNumber} from 'ethers';

export interface MeetingDto {
  metaDataHash: string;
  chairperson: string;
  stage: MeetingStage;
  registrationOpen: boolean;
  startDate: number;
  endDate: number;
  votes: string[];
  isVisible: boolean;
  registeredVoters: string[];
  representees: string[];
  representatives: string[];
  leaves: BigNumber[];
}

export interface MeetingModel {
  title: string;
  description: string;
  address: string;
  chairperson: string;
  stage: MeetingStage;
  registrationOpen: boolean;
  startDate: Date;
  endDate: Date;
  votes: string[];
  isVisible: boolean;
  registeredVoters: string[];
  representedBy: { [key: string]: string };
  leaves: BigNumber[];
}

export interface MeetingDetailModel extends MeetingModel {
  promisedToVote: boolean;
  hasGivenAuthority: boolean;
}

export enum MeetingStage {
  CREATED,
  OPEN,
  CLOSED
}

export class MeetingTab {
  static readonly VOTING: number = 1;
  static readonly PARTICIPANTS: number = 2;
  static readonly AUTHORITIES: number = 3;
}
