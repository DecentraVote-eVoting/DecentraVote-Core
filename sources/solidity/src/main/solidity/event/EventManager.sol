/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;

import "../vote/Interfaces/IVote.sol";

contract EventManager {
    mapping(address => bool) private whiteListed;

    constructor() {
        whiteListed[msg.sender] = true;
    }

    event AnonAccountRegistered(uint256 root, uint256 index);

    function anonAccountRegistered(uint256 root, uint256 index)
        external
        onlyByWhitelisted
    {
        emit AnonAccountRegistered(root, index);
    }

    event ChangedVote(address voteAddress);

    function changedVote(address voteAddress) external onlyByWhitelisted {
        emit ChangedVote(voteAddress);
    }

    //only necessary for the load-test worker
    event VoteOpen(address voteAddress);

    function voteOpen(address voteAddress) external onlyByWhitelisted {
        emit VoteOpen(voteAddress);
    }

    //only necessary for the ballot box
    event VoteClosed(address voteAddress, bool anon);

    function voteClosed(address voteAddress, bool anon)
        external
        onlyByWhitelisted
    {
        emit VoteClosed(voteAddress, anon);
    }

    event TreeHashCommitted(address voteAddress, bytes32 treeHash);

    function treeHashCommitted(address voteAddress, bytes32 treeHash)
        external
        onlyByWhitelisted
    {
        emit TreeHashCommitted(voteAddress, treeHash);
    }

    event ChangedMeeting(address meetingAddress);

    function changedMeeting(address meetingAddress) external onlyByWhitelisted {
        emit ChangedMeeting(meetingAddress);
    }

    event RemoveMeeting(address meetingAddress);

    function removeMeeting(address meetingAddress) external onlyByWhitelisted {
        emit RemoveMeeting(meetingAddress);
    }

    event NewResolutionDeployed(address indexed entityAddress);

    function newResolutionDeployed(address entityAddress)
        external
        onlyByWhitelisted
    {
        emit NewResolutionDeployed(entityAddress);
    }

    event ResolutionRemoved(address indexed meetingAddress, address indexed voteAddress);

    function resolutionRemoved(address meetingAddress, address voteAddress) external onlyByWhitelisted {
        emit ResolutionRemoved(meetingAddress, voteAddress);
    }

    event UserClaim(address indexed user, bytes32 claimHash, uint256 role);

    function userClaim(
        address user,
        bytes32 claimHash,
        uint256 role
    ) external onlyByWhitelisted {
        emit UserClaim(user, claimHash, role);
    }

    event MemberRemoved(address indexed member);

    function memberRemoved(address member) external onlyByWhitelisted {
        emit MemberRemoved(member);
    }

    event UserEdited(address indexed user, bytes32 claimHash, uint256 role);

    function userEdited(
        address user,
        bytes32 claimHash,
        uint256 role
    ) external onlyByWhitelisted {
        emit UserEdited(user, claimHash, role);
    }

    event GuestRemoved(address indexed guest);

    function guestRemoved(address guest) external onlyByWhitelisted {
        emit GuestRemoved(guest);
    }

    event NewGeneralMeetingDeployed(address indexed entityAddress);

    function newGeneralMeetingDeployed(address entityAddress)
        external
        onlyByWhitelisted
    {
        emit NewGeneralMeetingDeployed(entityAddress);
    }

    event Log(address indexed contractAddress, string logMessage);
    function log(address contractAddress, string calldata logMessage) external onlyByWhitelisted {
        emit Log(contractAddress, logMessage);
    }

    function whitelist(address toBeWhiteListed) external onlyByWhitelisted {
        whiteListed[toBeWhiteListed] = true;
    }

    function removeWhitelist(address toBeRemoved) external onlyByWhitelisted {
        whiteListed[toBeRemoved] = false;
    }

    modifier onlyByWhitelisted() {
        require(whiteListed[msg.sender], "E-01");
        _;
    }
}
