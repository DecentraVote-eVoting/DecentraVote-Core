/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {SimpleEntity} from './common.model';

export interface ToasterInfo {
  id?: string;
  type?: SimpleEntity<ToasterType>;
  message?: string;
}

export class ToasterType {
  static readonly ERROR: SimpleEntity<ToasterType> = {id: 0, text: 'Message.Level.Error'};
  static readonly WARNING: SimpleEntity<ToasterType> = {id: 1, text: 'Message.Level.Warning'};
  static readonly SUCCESS: SimpleEntity<ToasterType> = {id: 2, text: 'Message.Level.Success'};
  static readonly INFO: SimpleEntity<ToasterType> = {id: 3, text: 'Message.Level.Info'};
}
