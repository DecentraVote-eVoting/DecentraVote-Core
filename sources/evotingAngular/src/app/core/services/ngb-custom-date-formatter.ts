/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';

@Injectable({
  providedIn: 'root'
})
export class NgbCustomDateFormatter {

  parse(value: string): NgbDateStruct {
    if (value) {
      const dateParts = value.trim().split('.');
      if (dateParts.length === 1 && NgbCustomDateFormatter.isNumber(dateParts[0])) {
        return {day: NgbCustomDateFormatter.toInteger(dateParts[0]), month: null, year: null};
      } else if (dateParts.length === 2 && NgbCustomDateFormatter.isNumber(dateParts[0]) && NgbCustomDateFormatter.isNumber(dateParts[1])) {
        return {day: NgbCustomDateFormatter.toInteger(dateParts[0]), month: NgbCustomDateFormatter.toInteger(dateParts[1]), year: null};
      } else if (dateParts.length === 3 && NgbCustomDateFormatter.isNumber(dateParts[0]) && NgbCustomDateFormatter.isNumber(dateParts[1])
        && NgbCustomDateFormatter.isNumber(dateParts[2])) {
        return {
          day: NgbCustomDateFormatter.toInteger(dateParts[0]),
          month: NgbCustomDateFormatter.toInteger(dateParts[1]),
          year: NgbCustomDateFormatter.toInteger(dateParts[2])
        };
      }
    }
    return null;
  }

  format(date: NgbDateStruct): string {
    return date ?
      `${NgbCustomDateFormatter.isNumber(date.day) ? NgbCustomDateFormatter.padNumber(date.day) : ''}.${NgbCustomDateFormatter.isNumber(date.month)
        ? NgbCustomDateFormatter.padNumber(date.month) : ''}.${date.year}` : '';
  }

  private static padNumber(value: number) {
    if (NgbCustomDateFormatter.isNumber(value)) {
      return `0${value}`.slice(-2);
    } else {
      return '';
    }
  }

  private static isNumber(value: any): boolean {
    return !isNaN(NgbCustomDateFormatter.toInteger(value));
  }

  private static toInteger(value: any): number {
    return parseInt(`${value}`, 10);
  }

}
