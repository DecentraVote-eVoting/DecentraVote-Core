/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ObjectUtil} from '@core/utils/object.util';
import moment, {Moment} from 'moment';
import {DEFAULT_DATE_FORMAT} from '@core/models/common.model';

export class DateUtil {

  static formatDateToString(date: string | Date | number, sourceFormat: string, destFormat: string): string {
    if (ObjectUtil.isNullOrUndefined(date) || date === '') {
      return undefined;
    }
    return moment(date, sourceFormat).format(destFormat);
  }

  static formatNow(format: string = DEFAULT_DATE_FORMAT): string {
    return moment().format(format);
  }

  static toMoment(date: string | Date, format: string = DEFAULT_DATE_FORMAT): Moment {
    if (ObjectUtil.isNullOrUndefined(date) || date === '') {
      return undefined;
    }
    return moment(date, format);
  }

  static dateDiffDays(date1: string | Date, date2: string | Date, format: string = DEFAULT_DATE_FORMAT): number {
    const m1 = moment(date1, format);
    const m2 = moment(date2, format);
    return m1.diff(m2, 'days');
  }

}
