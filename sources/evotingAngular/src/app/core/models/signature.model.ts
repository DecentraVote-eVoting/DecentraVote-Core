/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {BallotBoxServer} from '@core/models/storage.model';

export class SignatureModel {
  signature: string;
  message: string;
}

export class SignatureContent {
  index: number;
  signer: string;
  voteAddress: string;
}

export class VoteCertificate {
  certificate: SignatureModel;
  ballotBox: BallotBoxServer;
  resolvedVoteOption?: string;
  isValid?: boolean;
}
