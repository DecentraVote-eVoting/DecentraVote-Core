/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ObjectUtil} from '@core/utils/object.util';

export class AssetFiles {
  // i18n
  static readonly LANG_DE: string = ObjectUtil.getHashOfAsset('de.json');
  static readonly LANG_EN: string = ObjectUtil.getHashOfAsset('en.json');

  // img
  static readonly LOGO: string = ObjectUtil.getHashOfAsset('logo.png');
  static readonly LOGO_SM: string = ObjectUtil.getHashOfAsset('logo_sm.png');

  // circom
  static readonly ZKEY: string = ObjectUtil.getHashOfAsset('circuit_final.zkey');
  static readonly WASM: string = ObjectUtil.getHashOfAsset('circuit.wasm');
  static readonly VERIFICATION_KEY: string = ObjectUtil.getHashOfAsset('verification_key.json');
}
