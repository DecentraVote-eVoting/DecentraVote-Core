/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {HASHED_PASSWORD, MNEMONIC, MNEMONIC_ENCRYPTED} from '@core/models/common.model';
import {ObjectUtil} from '@core/utils/object.util';
import * as CryptoJS from 'crypto-js';

export class SessionStorageUtil {

  static decryptMnemonic(mnemonic: string, password): string {
    try {
      return CryptoJS.AES.decrypt(mnemonic, password).toString(CryptoJS.enc.Utf8);
    } catch (err) {
      return null;
    }
  }

  static encryptMnemonic(mnemonic: string, password: string) {
    return CryptoJS.AES.encrypt(mnemonic, password).toString();
  }

  static getEncryptedMnemonic(): string {
    return sessionStorage.getItem(MNEMONIC_ENCRYPTED);
  }

  static setEncryptedMnemonic(encryptedMnemonic: string) {
    sessionStorage.setItem(MNEMONIC_ENCRYPTED, encryptedMnemonic);
  }

  static removeEncryptedMnemonic() {
    sessionStorage.removeItem(MNEMONIC_ENCRYPTED);
  }

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

  static getHashedPassword(): string {
    return sessionStorage.getItem(HASHED_PASSWORD);
  }

  static setHashedPassword(hashedPassword: string) {
    sessionStorage.setItem(HASHED_PASSWORD, hashedPassword);
  }

  static removeHashedPassword() {
    sessionStorage.removeItem(HASHED_PASSWORD);
  }

}
