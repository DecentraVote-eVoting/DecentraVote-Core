/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;

abstract contract IVoteDeployer {
    function newVote(
        address _organization,
        address _generalMeeting,
        address _eventManager,
        bytes32 _metaDataHash,
        bytes32 _attachmentHash,
        bytes32[] calldata _optionHashes,
        bool _anonymousVote
    ) external virtual returns (address);
}
