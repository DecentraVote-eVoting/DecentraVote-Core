/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {MNEMONIC} from '@core/models/common.model';
import {ObjectUtil} from '@core/utils/object.util';
import * as CryptoJS from 'crypto-js';

export class LocalStorageUtil {

  static getMnemonic(password: string): string {
    const encryptedMnemonic = localStorage.getItem(MNEMONIC);
    try {
      return CryptoJS.AES.decrypt(encryptedMnemonic, password).toString(CryptoJS.enc.Utf8);
    } catch (err) {
      return null;
    }
  }

  static setMnemonic(mnemonic: string, password: string) {
    const encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, password).toString();
    localStorage.setItem(MNEMONIC, encryptedMnemonic);
  }

  static removeMnemonic() {
    localStorage.removeItem(MNEMONIC);
  }

  static hasMnemonic(): boolean {
    return !ObjectUtil.isNullOrUndefined(localStorage.getItem(MNEMONIC));
  }

}
