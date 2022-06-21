/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {SignatureModel, VoteCertificate} from '@core/models/signature.model';
import {BallotBoxServer} from '@core/models/storage.model';
import {ObjectUtil} from '@core/utils/object.util';

export class LocalStorageUtil {

  static getCertificates(voteAddress: string, signer: string): VoteCertificate[] {
    return JSON.parse(localStorage.getItem(`certificates_${voteAddress.toLowerCase()}_${signer.toLowerCase()}`));
  }

  static setCertificate(voteAddress: string, signer: string, certificate: SignatureModel, ballotbox: BallotBoxServer) {
    let certs: VoteCertificate[];
    if (this.hasCertificates(voteAddress, signer)) {
      certs = this.getCertificates(voteAddress, signer);
    } else {
      certs = [];
    }
    certs.push({certificate: certificate, ballotBox: ballotbox} as VoteCertificate);
    localStorage.setItem(`certificates_${voteAddress.toLowerCase()}_${signer.toLowerCase()}`, JSON.stringify(certs));
  }

  static removeCertificates(voteAddress: string, signer: string) {
    localStorage.removeItem(`certificates_${voteAddress.toLowerCase()}_${signer.toLowerCase()}`);
  }

  static hasCertificates(voteAddress: string, signer: string): boolean {
    return !ObjectUtil.isNullOrUndefined(localStorage.getItem(`certificates_${voteAddress.toLowerCase()}_${signer.toLowerCase()}`));
  }

  static localItemExist (query: string): boolean {
    query = query.toLowerCase();
    for (const i in localStorage) {
      if (localStorage.hasOwnProperty(i)) {
        if (i.includes(query) && typeof i === 'string') {
          return true;
        }
      }
    }
    return false;
  }
}
