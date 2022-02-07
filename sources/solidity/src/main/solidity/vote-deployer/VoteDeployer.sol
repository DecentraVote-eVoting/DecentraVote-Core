/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;

import "../vote/Vote.sol";

contract VoteDeployer {
    function newVote(
        address _organization,
        address _generalMeeting,
        address _eventManager,
        bytes32 _metaDataHash,
        bytes32 _attachmentHash,
        bytes32[] calldata _optionHashes,
        bool _anonymousVote
    ) external returns (address) {
        return address(
            new Vote(
                _organization,
                _generalMeeting,
                _eventManager,
                _metaDataHash,
                _attachmentHash,
                _optionHashes,
                _anonymousVote
            )
        );
    }
}
