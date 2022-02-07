/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;
pragma experimental ABIEncoderV2;

import "./ExcludedList.sol";
import "../organization/Interfaces/IOrganization.sol";
import "../general-meeting/Interfaces/IGeneralMeeting.sol";
import "../event/EventManager.sol";

contract Vote is ExcludedList {
    IOrganization organization;
    IGeneralMeeting public generalMeeting;
    EventManager eventManager;
    bytes32 metadataHash;
    bytes32 attachmentHash;
    bytes32[] optionHashes;
    bytes32 reasonHash;
    bool anonymousVote;
    uint256 root;
    uint256 index;
    VoteStage public stage;
    uint256[2] chairpersonPublicKey;
    uint256 chairpersonPrivateKey;
    uint256 openedAtBlock;
    uint256 closedAtBlock;
    bytes32 treeHash;

    struct VoteDto {
        address parentGeneralMeeting;
        bytes32 metadataHash;
        bytes32 attachmentHash;
        bytes32[] optionHashes;
        bytes32 reasonHash;
        bytes32 treeHash;
        bool isAnonymous;
        VoteStage stage;
        uint256 root;
        uint256 index;
        uint256[2] chairpersonPublicKey;
        uint256 chairpersonPrivateKey;
        address[] excludedList;
        uint256[] leaves;
        uint256 openedAtBlock;
        uint256 closedAtBlock;
    }
    enum VoteStage {
        Created,
        Opened,
        Closed,
        Counted,
        Cancelled
    }

    constructor(
        address _organization,
        address _generalMeeting,
        address _eventManager,
        bytes32 _metadataHash,
        bytes32 _attachmentHash,
        bytes32[] memory _optionHashes,
        bool _anonymousVote
    ) {
        require(_optionHashes.length > 0, "V-01");
        organization = IOrganization(_organization);
        generalMeeting = IGeneralMeeting(_generalMeeting);
        eventManager = EventManager(_eventManager);
        metadataHash = _metadataHash;
        optionHashes = _optionHashes;
        anonymousVote = _anonymousVote;
        attachmentHash = _attachmentHash;
        stage = VoteStage.Created;
    }

    function excludeVoters(address[] calldata _excludedMembers)
        external
        onlyAtStage(VoteStage.Created)
        onlyByChairpersonOrDirector
    {
        _setExcluded(_excludedMembers);
        eventManager.changedVote(address(this));
    }

    function setAnonymous(bool _anonymousVote)
        external
        onlyAtStage(VoteStage.Created)
        onlyByChairpersonOrDirector
    {
        anonymousVote = _anonymousVote;
        eventManager.changedVote(address(this));
    }

    function editVote(
        bytes32 _metadataHash,
        bytes32 _attachmentHash,
        bytes32[] calldata _optionHashes,
        bool _anonymousVote
    ) external onlyAtStage(VoteStage.Created) onlyByChairpersonOrDirector {
        require(_optionHashes.length > 0, "V-02");
        metadataHash = _metadataHash;
        optionHashes = _optionHashes;
        anonymousVote = _anonymousVote;
        attachmentHash = _attachmentHash;
        eventManager.changedVote(address(this));
    }

    function replaceExcluded(address oldAccount, address newAccount)
        external
        isGeneralMeeting
    {
        _removeExcluded(oldAccount);
        _addExcluded(newAccount);
        eventManager.changedVote(address(this));
    }

    // STAGES

    function openVote(uint256[2] calldata _publicKey, uint256[] calldata unregisteredRepresentativePositions)
        external
        onlyAtStage(VoteStage.Created)
        onlyAtGeneralMeetingStage(IGeneralMeeting.GeneralMeetingStage.MeetingOpen)
        onlyByChairperson
        incrementVoteStage
    {
        generalMeeting.incrementVoteStage();
        root = generalMeeting.excludeFromVote(
            _getExcluded(),
            unregisteredRepresentativePositions
        );
        if (anonymousVote) {
            organization.incrementLastIndex(root);
            index = organization.reserveIndex(root);
        }
        openedAtBlock = block.number;
        chairpersonPublicKey = _publicKey;
        eventManager.changedVote(address(this));
        eventManager.log(address(this), "Vote Open");
    }

    function endVote()
        external
        onlyAtStage(VoteStage.Opened)
        onlyByChairperson
        incrementVoteStage
    {
        closedAtBlock = block.number;
        generalMeeting.decrementVoteStage();
        eventManager.changedVote(address(this));
        eventManager.voteClosed(address(this), anonymousVote);
    }

    function startCountingVotes(uint256 privateKey)
        external
        onlyAtStage(VoteStage.Closed)
        treeHashShouldBePresent(true)
        onlyByChairperson
        incrementVoteStage
    {
        chairpersonPrivateKey = privateKey;
        eventManager.changedVote(address(this));
    }

    function cancelVote(bytes32 _reasonHash)
        external
        onlyAtStage(VoteStage.Created)
        onlyByChairpersonOrDirector
    {
        stage = VoteStage.Cancelled;
        reasonHash = _reasonHash;
        eventManager.changedVote(address(this));
    }

    // BALLOTBOX

    function commitTreeHash(bytes32 _treeHash)
        external
        onlyAtStage(VoteStage.Closed)
        onlyByBallotBox
        treeHashShouldBePresent(false)
    {
        treeHash = _treeHash;
        eventManager.treeHashCommitted(address(this), _treeHash);
    }

    // MODIFIERS

    modifier onlyByBallotBox() {
        require(organization.isBallotBox(msg.sender), "V-04");
        _;
    }

    modifier onlyByChairperson() {
        require(msg.sender == generalMeeting.chairperson(), "V-05");
        _;
    }

    modifier onlyByChairpersonOrDirector() {
        require(
            generalMeeting.isChairpersonOrDirectorResponsible(msg.sender),
            "V-07"
        );
        _;
    }

    modifier onlyAtGeneralMeetingStage(
        IGeneralMeeting.GeneralMeetingStage _stage
    ) {
        require(generalMeeting.stage() == _stage, "V-08");
        _;
    }

    modifier onlyAtStage(VoteStage _stage) {
        require(stage == _stage, "V-09");
        _;
    }

    modifier treeHashShouldBePresent(bool value) {
        require((treeHash != 0x00) == value, "V-14");
        _;
    }

    modifier incrementVoteStage() {
        _;
        stage = VoteStage(uint256(stage) + 1);
    }

    modifier isGeneralMeeting() {
        require(msg.sender == address(generalMeeting), "V-12");
        _;
    }

    // GETTERS

    function getOptionHashes() external view returns (bytes32[] memory) {
        return optionHashes;
    }

    function getChairpersonPublicKey() external view returns (uint256[2] memory) {
        return chairpersonPublicKey;
    }

    function getVoteDto() external view returns (VoteDto memory) {
        return VoteDto({
            parentGeneralMeeting : address(generalMeeting),
            metadataHash : metadataHash,
            attachmentHash : attachmentHash,
            optionHashes : optionHashes,
            reasonHash : reasonHash,
            treeHash : treeHash,
            isAnonymous : anonymousVote,
            root : root,
            index : index,
            stage : stage,
            chairpersonPublicKey : chairpersonPublicKey,
            chairpersonPrivateKey : chairpersonPrivateKey,
            excludedList : _getExcluded(),
            leaves : _getLeavesOfVersion(),
            openedAtBlock : openedAtBlock,
            closedAtBlock : closedAtBlock
        });
    }

    function _getLeavesOfVersion() internal view returns (uint256[] memory) {
        return generalMeeting.getLeavesOfVersion(address(this));
    }

    function ballotBoxState() external view returns (uint256, VoteStage, bool) {
        return (root, stage, anonymousVote);
    }

    function getNumberOfVotingRights(address entityAddress)
        external
        view
        returns (uint256) {
        return generalMeeting.getNumberOfVotingRights(entityAddress);
    }

    function getTreeHashAlreadyCommitted() external view returns (bool) {
        return treeHash != 0x00;
    }
}
