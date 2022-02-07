/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
export class SignatureModel {
  signature: string;
  message: string;
}

export class SignatureContent {
  index: number;
  signer: string;
  voteAddress: string;
}
