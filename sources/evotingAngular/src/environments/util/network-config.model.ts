/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
export interface NetworkConfigModel {
  'wsRpcServer': string;
  'httpRpcServer': string;
  'ensRegistryAddress': string;
  'networkId': number;
  'gasPrice': number;
  'gasLimit': number;
}
