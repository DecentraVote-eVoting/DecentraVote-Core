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
      const customer = localStorage.getItem('decentravote-organization').replace('.decentravoteapp', '');
      let url;
      let address;

      if (customer.includes('.')) {
        url = customer;
        address = customer.split('.')[0] + '.decentravoteapp';
      } else {
        url = customer + '.main';
        address = customer + '.decentravoteapp';
      }
      this.organizationAddress = address;
      this.oracleURL = `https://oracle-${url}.decentravoteapp.de`;
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
