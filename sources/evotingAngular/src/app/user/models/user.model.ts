/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Role} from '@user/models/role.model';

/** used only for whoAmI from Oracle Service.
 * field names mustn't change as per OAuth 2.0 */
export interface jwtUser {
  // TODO: revert naming when keycloak is fixed
  // givenName: string;
  // familyName: string;
  field1: string;      // givenName
  field2: string;      // familyName
}

export interface User {
  address: string;
  claimHash: string;
  resolvedClaim: ResolvedClaim;
  role: Role;
}

export interface ResolvedClaim {
  field0: string;
  field1: string;
  field2: string;
}

export interface VotingMember {
  member: User;
  representative?: User;
  votingCount?: number;
  potentialVotingCount?: number;
}

export class UserTab {
  static readonly MEMBER: number = 1;
  static readonly GUEST: number = 2;
}
