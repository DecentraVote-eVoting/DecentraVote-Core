/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;

abstract contract IGeneralMeeting {
    uint256 public countOfVotesWithStageOpen;
    GeneralMeetingStage public stage;
    address public chairperson;
    bool public registrationOpen;

    enum GeneralMeetingStage {
        Created,
        MeetingOpen,
        MeetingClosed
    }

    function replaceAccount(
        address oldAccount,
        address newAccount,
        uint256 newSecret
    ) external virtual;

    function incrementVoteStage() external virtual;

    function excludeFromVote(
        address[] calldata voters,
        uint256[] calldata unregisteredRepresentativePositions
    ) external virtual returns (uint256);

    function decrementVoteStage() external virtual;

    function decryptValue(
        uint256 privateKey,
        uint256[2] memory publicKey,
        uint256 hashedValue,
        uint256 maxValue
    ) public view virtual returns (uint256 value);

    function getNumberOfVotingRights(address voter)
        external
        view
        virtual
        returns (uint256 numberOfRights);

    function isChairpersonOrDirectorResponsible(address entityAddress)
        public
        view
        virtual
        returns (bool);

    function getLeavesOfVersion(address version)
        external
        view
        virtual
        returns (uint256[] memory);

    function getRegisteredMemberSize()
        external
        view
        virtual
        returns (uint256 numberOfRegisteredMembers);
}
