/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {StorageVotingOption} from '@core/models/storage.model';
import {ExportUser, ImportUser} from "@import-user/models/import-user.model";
import {Role} from '@user/models/role.model';

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
      field0: user.field0,
      field1: user.field1,
      field2: user.field2,
      role: user.role,
      accessCode: user.accessCode || '/'
    });
  }
}
