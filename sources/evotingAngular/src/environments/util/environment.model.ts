/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {NetworkConfigModel} from './network-config.model';

export interface EnvironmentModel {
  production: boolean;
  networks: { [key: string]: NetworkConfigModel };
}
