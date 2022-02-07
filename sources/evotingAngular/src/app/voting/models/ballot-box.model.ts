/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Ballot, ZKProofDTO} from '@core/models/ballot-box.model';
import {SignatureModel} from '@core/models/signature.model';

export interface BallotBox {
  voteAddress: string;
  verifiableBallots: VerifiableBallot[];
}

export interface VerifiableBallot {
  ballot: Ballot;
  zkProof?: ZKProofDTO;
  signedDecision: SignatureModel;
  signedNullifier?: SignatureModel;
  signerAddress?: string;
}
