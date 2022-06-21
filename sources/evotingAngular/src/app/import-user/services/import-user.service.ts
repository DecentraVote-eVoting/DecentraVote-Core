/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {importUserJoiSchema, ImportUserRaw} from '@import-user/models/import-user.model';
import * as Papa from 'papaparse';

@Injectable({
  providedIn: 'root'
})
export class ImportUserService {

  constructor() {
  }

  parseJson(fileContent): ImportUserRaw[] {
    try {
      return JSON.parse(fileContent);
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error(e.message);
      } else {
        throw new Error(`['EXPLICIT'] ${e.name}: ${e.message}`);
      }
    }
  }

  parseCSV(fileContent): ImportUserRaw[] {
    const parsedCsv = Papa.parse(fileContent, {
      header: true,
    });
    if (parsedCsv.errors) {
      parsedCsv.errors.map(error => {
        throw new Error(error.message);
      });
    }
    return parsedCsv.data;
  }

  validateImportUserRawObject(data): ImportUserRaw[] {
    if (!data || data.length <= 0) {
      return;
    }
    const validatedObject = importUserJoiSchema.validate(data, {allowUnknown: false});
    if (validatedObject.error) {
      throw new Error(validatedObject.error.message);
    }
    return validatedObject.value;
  }

  toCSV(data) {
    return Papa.unparse(data, {delimiter: ';'});
  }
}
