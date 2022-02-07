/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import Joi from 'joi';

export interface ImportUserFields {
  field0: string;
  field1: string;
  field2: string;
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
    field0: Joi.string()
      .required(),
    field1: Joi.string(),
    field2: Joi.string(),
  })
);
