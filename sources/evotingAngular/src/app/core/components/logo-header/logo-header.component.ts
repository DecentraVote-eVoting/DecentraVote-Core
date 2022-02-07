/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component} from '@angular/core';
import {AssetFiles} from '@core/models/asset.model';

@Component({
  selector: 'app-logo-header',
  templateUrl: './logo-header.component.html'
})
export class LogoHeaderComponent {

  assetFiles = AssetFiles;

  constructor() {
  }

}
