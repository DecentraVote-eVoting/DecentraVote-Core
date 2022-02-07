/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;
pragma experimental ABIEncoderV2;

abstract contract IVote {
    enum VoteStage {
        Created,
        Opened,
        Closed,
        Counted,
        Cancelled
    }

    function excludeVoters(address[] calldata _excludedMembers)
        external
        virtual;

    function setAnonymous(bool _anonymousVote) external virtual;

    function editVote(
        bytes32 _metadataHash,
        bytes32 _attachmentHash,
        bytes32[] calldata _optionHashes,
        bool _anonymousVote
    ) external virtual;

    function replaceExcluded(address oldAccount, address newAccount) external virtual;

    function openVote(uint256[2] calldata _publicKey) external virtual;

    function endVote() external virtual;

    function startCountingVotes(uint256 privateKey) external virtual;

    function cancelVote(bytes32 _reasonHash) external virtual;

    // Ballotbox

    function commitTreeHash(bytes32 _treeHash) external virtual;

    // GETTERS

    VoteStage public stage;

    function getOptionHashes() external view virtual returns (bytes32[] memory);

    function getChairpersonPublicKey() external view virtual returns (uint256[2] memory);

    function ballotBoxState() external view virtual returns (uint256, VoteStage, bool);

    function getNumberOfVotingRights(address entityAddress) external view virtual returns (uint256);

    function getTreeHashAlreadyCommitted() external view virtual returns (bool);


    // ExcludedList

    function isExcluded(address entityAddress) external view virtual returns (bool);

    function getExcluded() external view virtual returns (address[] memory);

    function getExcludedSize() external view virtual returns (uint256);
}
