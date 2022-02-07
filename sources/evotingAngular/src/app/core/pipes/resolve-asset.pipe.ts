/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Pipe, PipeTransform} from '@angular/core';
import {StorageService} from '@core/services/storage.service';

@Pipe({name: 'ResolveAsset'})
export class ResolveAssetPipe implements PipeTransform {

  constructor(private storageService: StorageService) {
  }

  transform(value: string) {
    return this.storageService.getData(value, true);
  }

}
