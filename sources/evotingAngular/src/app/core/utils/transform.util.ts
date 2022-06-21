/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {StorageVotingOption} from '@core/models/storage.model';
import {ExportUser, ImportUser} from '@import-user/models/import-user.model';

export class TransformUtil {

  static transformStorageVotingOptionArrayToStringArray(voteOptions: StorageVotingOption[]): string[] {
    const data: string[] = [];
    voteOptions.forEach(option => {
      data.push(option.value);
    });
    return data;
  }

  static transformImportUserToExportUser(importUser: ImportUser[]): ExportUser[] {
    return importUser.map(user => <ExportUser>{
      uid: user.uid,
      name1: user.name1,
      name2: user.name2,
      role: user.role,
      accessCode: user.accessCode || '/'
    });
  }
}
