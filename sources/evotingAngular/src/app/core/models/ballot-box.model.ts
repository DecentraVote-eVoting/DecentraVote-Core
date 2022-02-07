/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {SignatureModel} from '@core/models/signature.model';


export interface ZKProofDTO {
  proof: ZKProofPoints;
  publicSignals: string[];
}

export interface ZKProofPoints {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
}

export interface Ballot {
  decisionHash: string;
  publicKey: string[];
}

export interface BallotDTO {
  zkProof?: ZKProofDTO;
  signedDecision: SignatureModel;
  signedNullifier?: SignatureModel;
}

export interface OpenBallotNullifier {
  index: number;
  voteAddress: String;
  signer: String;
}
