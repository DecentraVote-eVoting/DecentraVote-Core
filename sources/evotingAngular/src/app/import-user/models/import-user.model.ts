/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import Joi from 'joi';

export interface ImportUserFields {
  uid: string;
  name1: string;
  name2: string;
}

export interface ImportUserRaw extends ImportUserFields {
  role: number;
  accessCode?: string;
}

export interface ImportUser extends ImportUserRaw {
  id: number;
  validUntil: string;
}

export interface ExportUser extends ImportUserFields {
  role: number;
  accessCode: string;
}

export const importUserJoiSchema = Joi.array().items(
  Joi.object({
    uid: Joi.string().required(),
    name1: Joi.string(),
    name2: Joi.string(),
    role: Joi.number()
  })
);
