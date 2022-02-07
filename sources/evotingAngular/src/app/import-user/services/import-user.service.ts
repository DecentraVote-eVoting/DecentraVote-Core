/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {ImportUserFields, importUserJoiSchema, ImportUserRaw} from '@import-user/models/import-user.model';
import * as Papa from 'papaparse';

@Injectable({
  providedIn: 'root'
})
export class ImportUserService {

  constructor() {
  }

  readFile = (blob: Blob, reader: FileReader = new FileReader()) => new Observable(obs => {
    if (!(blob instanceof Blob)) {
      obs.error(new Error('`blob` must be an instance of File or Blob.'));
      return;
    }

    reader.onerror = err => obs.error(err);
    reader.onabort = err => obs.error(err);
    reader.onload = () => obs.next(reader.result);
    reader.onloadend = () => obs.complete();

    return reader.readAsText(blob);
  })

  parseJson(fileContent): string {
    try {
      return JSON.parse(fileContent);
    } catch (e) {
      if (e instanceof SyntaxError) {
        console.log(e.message);
        throw new Error(e.message);
      } else {
        throw new Error(`['EXPLICIT'] ${e.name}: ${e.message}`);
      }
    }
  }

  parseCSV(fileContent): ImportUserFields[] {
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

  validateJson(json): ImportUserRaw[] {
    if (!json || json.length <= 0) {
      return;
    }
    const validatedObject = importUserJoiSchema.validate(json, {allowUnknown: true});
    if (validatedObject.error) {
      throw new Error(validatedObject.error.message);
    }
    return validatedObject.value;
  }

  toCSV(data) {
    return Papa.unparse(data, {delimiter: ';'});
  }
}
