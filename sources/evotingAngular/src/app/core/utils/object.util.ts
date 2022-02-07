/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import * as assets from '../../../../../shared-resources/src/main/resources/asset_addresses.json';

export class ObjectUtil {

  static isNullOrUndefined(value: any): value is undefined | null {
    return value == null;
  }

  static convertJsonFileToObject(base64String: string): any {
    const json = base64String.split(',');
    const jsonOb = ObjectUtil.b64DecodeUnicode(json[1]);
    return JSON.parse(jsonOb);
  }

  static b64DecodeUnicode(str: string): string {
    return decodeURIComponent(atob(str).split('').map(function (c) {
      // Going backwards: from byte stream, to percent-encoding, to original string.
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

  static convertToUint8Array(str: string): Buffer {
    const base64String = str.split(',')[1];
    return Buffer.from(base64String, 'base64');
  }

  static getHashOfAsset(name: string): string {
    const assetFiles: any = (assets as any).default;
    const assetFile = assetFiles.find(a => a.filename === name);
    return assetFile && assetFile.hash;
  }

  static isEmptyHash(obj: any): boolean {
    return obj &&
      (
        obj === '0' ||
        obj === '0x00' ||
        obj === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
        obj._hex === '0' ||
        obj._hex === '0x00' ||
        obj._hex === '0x0000000000000000000000000000000000000000000000000000000000000000' ||
        obj === '1' ||
        obj === '0x01' ||
        obj === '0x0000000000000000000000000000000000000000000000000000000000000001' ||
        obj._hex === '1' ||
        obj._hex === '0x01' ||
        obj._hex === '0x0000000000000000000000000000000000000000000000000000000000000001'
      );
  }

  static sigmoid(x) {
    return 1 / (1 + Math.exp(-10 * (x - 0.5)));
  }
}
