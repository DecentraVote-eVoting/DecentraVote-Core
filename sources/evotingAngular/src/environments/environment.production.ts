/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import * as epn from '../../../shared-resources/src/main/resources/epn_config.json';
import * as bloxberg from '../../../shared-resources/src/main/resources/bloxberg_config.json';
import * as evan from '../../../shared-resources/src/main/resources/evan_config.json';
import {EnvironmentModel} from './util/environment.model';

// Remove the imports of networks you dont want to use
export const environment: EnvironmentModel = {
  production: true,
  networks: {
    epn: epn,
    bloxberg: bloxberg,
    evan: evan
  }
};
