/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {User} from '@app/user/models/user.model';

export interface MemberWithVotingCount extends User {
  votingCount: number;
}

export interface MemberWithPotentialVotingCount extends User {
  potentialVotingCount: number;
}

export interface MemberRepresentation {
  representee: User;
  representative: User;
}
