/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import * as crypto from 'crypto-browserify';

export class StorageData {
  readonly v?: string = '0.1';
  readonly salt?: string = StorageData.randomString(16);

  public static randomString(length) {
    const s: string = crypto.randomBytes(length).toString('base64');
    return s.substring(0, length);
  }
}

export class StorageClaim extends StorageData {
  name1?: string;
  name2?: string;
  uid?: string;
}

export class StorageMetaData extends StorageData{
  title?: string;
  description?: string;
}

export class StorageVote extends StorageMetaData {
  filename?: string;
}

export class StorageVotingOption extends StorageData {
  value?: string;
}

export class StorageArchiveReason extends StorageData {
  reason?: string;
}

export interface StorageDTO {
  hash: string;
  data: string;
}

export interface CacheMultiResponse extends StorageDTO {
}

export interface StorageMultiResponse extends StorageDTO {
}

export interface StorageServer extends RegistrableServer {
}

export interface BallotBoxServer extends RegistrableServer {
}

export interface RegistrableServer {
  url?: string;
  address?: string;
  owner?: string;
}
