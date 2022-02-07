/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {MNEMONIC} from '@core/models/common.model';
import {ObjectUtil} from '@core/utils/object.util';

export class SessionStorageUtil {

  static getMnemonic(): string {
    return sessionStorage.getItem(MNEMONIC);
  }

  static setMnemonic(mnemonic: string) {
    sessionStorage.setItem(MNEMONIC, mnemonic);
  }

  static removeMnemonic() {
    sessionStorage.removeItem(MNEMONIC);
  }

  static hasMnemonic(): boolean {
    return !ObjectUtil.isNullOrUndefined(sessionStorage.getItem(MNEMONIC));
  }

}
