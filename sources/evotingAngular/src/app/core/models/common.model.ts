/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
export interface SimpleEntity<T> {
  id: number;
  text: string;
}

export class SetupStep {
  static readonly GET_STARTED: number = 1;
  static readonly NEW_OR_IMPORT: number = 2;
  static readonly CREATE_PASSWORD: number = 3;
  static readonly CREATE_MNEMONIC: number = 4;
  static readonly FINISH: number = 5;
}

export const MNEMONIC: string = 'decentravote-mnemonic';
export const TOKEN_ACCESS = 'access_token';
export const TOKEN_REFRESH = 'refresh_token';
export const COOKIE_ACCESS = 'evoting-access';
export const COOKIE_REFRESH = 'evoting-refresh';
export const HEADER_AUTHORIZATION = 'X-Authorization';
export const TRANSACTION_STATUS_OK = 1;
export const REGEX_PASSWORD = new RegExp('^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d\\@$!%*#?&/\\-\\\\§"+&()\\]\\[=}{`´^\'~_<> |;,:.]{8,}$');
export const REGEX_PASSWORD_NUMBER = new RegExp('^.*\\d+.*$');
export const REGEX_PASSWORD_LETTER = new RegExp('^.*[A-Za-z]+.*$');
export const CACHE_NAME = 'evoting-cache';
export const CACHE_DATE_ADDED = 'X-Date-Added';
export const CACHE_REQUEST = 'X-Request';
export const CACHE_CLEANUP_DAYS = 15;
export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD-HH-mm-ss';

export class AuthenticationMethod {
  static readonly KEYCLOAK: string = 'Keycloak';
  static readonly TOKEN: string = 'Token';
}

export const ENDPOINT_STORAGE = '/api/storage';
export const ENDPOINT_STORAGE_SAVE = '/api/storage/save';
export const ENDPOINT_STORAGE_GET = '/api/storage/get';
export const ENDPOINT_RELAY = '/api/relay';
export const ENDPOINT_ORACLE = '/api';
export const ENDPOINT_AUTH = '/auth';
export const ENDPOINT_ALT_PROOFGEN = 'https://3691pafwih.execute-api.eu-central-1.amazonaws.com/default/proofGen';
