/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;

abstract contract IGeneralMeetingDeployer {
    function newGeneralMeeting(
        address voteDeployer,
        address organization,
        uint256 _startDate,
        uint256 _endDate,
        address _chairperson,
        address eventManager,
        bytes32 _metaDataHash,
        uint256 _treeDepth,
        address _mimcAddress,
        address _mimcspongeHash
    ) external virtual returns (address);
}
