/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {TranslateLoader} from '@ngx-translate/core';
import {Observable} from 'rxjs';
import {StorageService} from '@core/services/storage.service';
import {map} from 'rxjs/operators';
import {ObjectUtil} from '@core/utils/object.util';
import {AssetFiles} from '@core/models/asset.model';

export class StorageTranslationLoader implements TranslateLoader {

  constructor(private storageService: StorageService) {
  }

  private translations = {
    de: AssetFiles.LANG_DE,
    en: AssetFiles.LANG_EN
  };

  getTranslation(lang: string): Observable<any> {
    return this.storageService.getData(this.translations[lang], true).pipe(map(ObjectUtil.convertJsonFileToObject));
  }

}
