/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {isDevMode} from '@angular/core';

export class LoggingUtil {

  static error(message: string, ...params: any[]) {
    if (isDevMode()) {
      console.error(message, ...params);
    }
  }

  static warn(message: string, ...params: any[]) {
    if (isDevMode()) {
      console.warn(message, ...params);
    }
  }

  static info(message: string, ...params: any[]) {
    if (isDevMode()) {
      console.log(message, ...params);
    }
  }
}
