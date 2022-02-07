/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable, Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'SolidityError'})
@Injectable({
  providedIn: 'root'
})
export class SolidityErrorPipe implements PipeTransform {

  private errorStrings = {
    /* Organization.sol */
    'O-01': '[Organization] Given address for function topUpUser is not a user',
    'O-02': '[Organization] Given address for function changeOracle is not a valid address',
    'O-03': '[Organization] nextIndexForRoot must be smaller than lastIndexForRoot',
    'O-04': '[Organization] Sender of transaction must be a director',
    'O-05': '[Organization] Sender of transaction must be a director, oracle or organization contract',
    'O-06': '[Organization] Sender of transaction must be a director or member',
    'O-07': '[Organization] Sender of transaction must be a member',
    'O-08': '[Organization] Sender of transaction must be a GeneralMeeting contract',
    'O-09': '[Organization] Sender of transaction must be a ballotBox',
    'O-10': '[Organization] Sender of transaction must be an oracle',
    'O-11': '[Organization] GlobalMeetingStage of organization is not at 0',
    'O-12': '[Organization] Sender of transaction must be a vote contract',
    'O-13': '[Organization] Given address for function removeGeneralMeeting is not a GM',
    'O-14': '[Organization] GeneralMeetingStage of given gmAddress in function removeGeneralMeeting must be CREATED',
    'O-15': '[Organization] Registration is not allowed to be open of given gmAddress in function removeGeneralMeeting',
    'O-16': '[Organization] RegisteredMemberSize of given gmAddress in function removeGeneralMeeting must be 0',

    /* Eventmanager.sol */
    'E-01': '[EventManager] Sender of transaction is not whitelisted',

    /* GeneralMeeting.sol */
    'G-01': '[GeneralMeeting] Stage of meeting must be lesser than or equal OPEN',
    'G-02': '[GeneralMeeting] Given address for function removeVote is not a vote',
    'G-03': '[GeneralMeeting] VoteStage of given voteAddress in function removeVote must be CREATED',
    'G-04': '[GeneralMeeting] Function replaceAccount can only be called by organization contract',
    'G-05': '[GeneralMeeting] There should be no open Vote when replacing an Account',
    'G-06': '[GeneralMeeting] New sorting length in function changeVoteOrder does not match old sorting length',
    'G-07': '[GeneralMeeting] Element in new sorting in function changeVoteOrder is not a vote',
    'G-08': '[GeneralMeeting] Sender of transaction must be a chairperson or director',
    'G-09': '[GeneralMeeting] Sender of transaction must be a director',
    'G-10': '[GeneralMeeting] Sender of transaction must be a member',
    'G-11': '[GeneralMeeting] Sender of transaction must be a chairperson',
    'G-12': '[GeneralMeeting] Sender of transaction must be a vote contract',
    'G-13': '[GeneralMeeting] Current GeneralMeetingStage does not match required one',
    'G-14': '[GeneralMeeting] Current GeneralMeetingStage does not match one of the required ones',
    'G-15': '[GeneralMeeting] Registration must be open',
    'G-16': '[GeneralMeeting] Meeting can only be closed if there is no Vote at Stage Open',

    /* MerkleTree.sol */
    'M-01': '[MerkleTree] Given version in function getLeavesOfVersion is not a valid address',

    /* Register.sol */
    'R-01': '[Register] Sender of transaction must not be already registered',
    'R-02': '[Register] Given voter in function grantRepresentation must not already be represented',
    'R-03': '[Register] Given representative in function grantRepresentation must not already be represented',
    'R-04': '[Register] PositionsOfHashedSecretsInTreeOfUser of given voter in function grantRepresentation must not be bigger than 1',
    'R-05': '[Register] Given voter in function grantRepresentation must be a member',
    'R-06': '[Register] Given representative in function grantRepresentation must be a member',
    'R-07': '[Register] Given voter in function removeRepresentation does not have a representative',
    'R-08': '[Register] Hashed Secret is already used. It has to be unique',

    /* TrustlessServiceRegister.sol */
    'T-01': '[TrustlessServiceRegister] Sender of transaction must be a storage',
    'T-02': '[TrustlessServiceRegister] Given address for function addStorage is not a valid address',

    /* UserList.sol */
    'U-01': '[UserList] Given hashedClaim in function addUser must not be null',
    'U-02': '[UserList] Given role in function addUser is not valid',
    'U-03': '[UserList] Given newRole in function editUser is not valid',
    'U-04': '[UserList] Given hashedClaim in function setClaimHash must not be null',
    'U-05': '[UserList] Length of given data last in function setList must not be 0',
    'U-06': '[UserList] List already contains provided entityData in function add',
    'U-07': '[UserList] List does not contain provided entityAddress in function remove',
    'U-08': '[UserList] List does not contain provided entityAddress in function update',
    'U-09': '[UserList] Given newHashedClaim in function editUser must not be null',
    'U-10': '[UserList] Given entityAddress in function addUser must not already exist',
    'U-11': '[UserList] Last director can not be removed',
    'U-12': '[UserList] Changing the role is only allowed if no meeting is open',

    /* List.sol */
    'L-01': '[List] List already contains provided entityAddress in function add',
    'L-02': '[List] List does not contain provided entityAddress in function remove',

    /* Vote.sol */
    'V-01': '[Vote] Length of given optionHashes in constructor must be bigger than 0',
    'V-02': '[Vote] Length of given optionHashes in function editVote must be bigger than 0',
    'V-03': '[Vote] TreeHash in function startCountingVotes must not be null',
    'V-04': '[Vote] Sender of transaction must be a ballotBox',
    'V-05': '[Vote] Sender of transaction must be a chairperson',
    'V-06': '[Vote] Sender of transaction must be director',
    'V-07': '[Vote] Sender of transaction must be a chairperson or director',
    'V-08': '[Vote] MeetingStage does not match required stage',
    'V-09': '[Vote] VoteStage does not match required stage',
    'V-10': '[Vote] VoteStage is not before required stage',
    'V-11': '[Vote] VoteStage is not after required stage',
    'V-12': '[Vote] Sender of transaction must be a generalMeeting contract',
    'V-13': '[Vote] One of the given VoteStages does not match required stage',
    'V-14': '[Vote] TreeHash is already committed',
    'V-15': '[Vote] TreeHash is not committed',

    /* General Errors */
    'missing response': 'Server has not replied too many times'
  };

  transform(error: any): any {
    if (error.reason === 'missing response') {
      return this.errorStrings['missing response'];
    }

    const code = error.error.message.split('revert ')[1];
    return this.errorStrings[code];
  }
}
