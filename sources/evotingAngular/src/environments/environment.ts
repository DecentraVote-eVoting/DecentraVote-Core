/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import * as local from '../../../shared-resources/src/main/resources/local_config.json';
import {EnvironmentModel} from './util/environment.model';

export const environment: EnvironmentModel = {
  production: false,
  networks: {
    local: local
  }
};
