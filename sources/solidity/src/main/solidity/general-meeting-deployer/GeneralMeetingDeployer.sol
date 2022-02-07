/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;

import "../general-meeting/GeneralMeeting.sol";
import "../general-meeting/Interfaces/IGeneralMeeting.sol";
import "../vote-deployer/Interfaces/IVoteDeployer.sol";
import "../event/EventManager.sol";
import "./Interfaces/IGeneralMeetingDeployer.sol";

contract GeneralMeetingDeployer {
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
    ) external returns (address) {
        return address(
            new GeneralMeeting(
                voteDeployer,
                organization,
                _startDate,
                _endDate,
                _chairperson,
                eventManager,
                _metaDataHash,
                _treeDepth,
                _mimcAddress,
                _mimcspongeHash
            )
        );
    }
}
