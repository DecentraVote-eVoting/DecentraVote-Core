/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {NetworkConfigModel} from '../../../environments/util/network-config.model';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {

  private readonly network;
  private readonly organizationAddress;


  private readonly oracleURL: string;
  private readonly networkConfig: NetworkConfigModel;

  constructor() {
    if (environment.production) {
      this.network = localStorage.getItem('network');
      this.organizationAddress = localStorage.getItem('decentravote-organization');
      this.oracleURL = 'https://oracle.' + this.organizationAddress + '.de';
    } else {
      this.network = 'local';
      this.organizationAddress = 'local.decentravoteapp';
      this.oracleURL = 'http://localhost:8080';
    }
    this.networkConfig = environment.networks[this.network];
  }

  config(): NetworkConfigModel {
    return this.networkConfig;
  }

  getOrganizationAddress(): string {
    return this.organizationAddress;
  }

  getNetwork(): string {
    return this.network;
  }

  getOracleURL() {
    return this.oracleURL;
  }
}
