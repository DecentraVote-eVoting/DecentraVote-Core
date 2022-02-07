/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;
pragma experimental ABIEncoderV2;

import "../vote/Vote.sol";
import "./Register.sol";
import "../organization/Interfaces/IOrganization.sol";
import "../general-meeting/Interfaces/IGeneralMeeting.sol";
import "../vote-deployer/Interfaces/IVoteDeployer.sol";
import "../vote/Interfaces/IVote.sol";
import "../event/EventManager.sol";

contract GeneralMeeting is Register {

    struct GeneralMeetingDto {
        address chairperson;
        GeneralMeetingStage stage;
        bool registrationOpen;
        uint256 startDate;
        uint256 endDate;
        IVote[] votes;
        bool isVisible;
        address[] registeredVoters;
        address[] representees;
        address[] representatives;
        uint256[] leaves;
        bytes32 metaDataHash;
    }

    enum GeneralMeetingStage {
        Created,
        MeetingOpen,
        MeetingClosed
    }

    GeneralMeetingStage public stage;
    EventManager eventManager;
    IVoteDeployer voteDeployer;
    IOrganization organization;
    IVote[] votes;
    mapping(address => bool) isVote;

    address public chairperson;
    uint256 startDate;
    uint256 endDate;
    bytes32 metaDataHash;
    bool public registrationOpen;
    bool isVisible;
    uint256 public countOfVotesWithStageOpen;

    constructor(
        address _voteDeployer,
        address _organization,
        uint256 _startDate,
        uint256 _endDate,
        address _chairperson,
        address _eventManager,
        bytes32 _metaDataHash,
        uint256 _levels,
        address mimcAddress,
        address mimcspongeAddress
    ) MerkleTree(_levels) Crypto(mimcAddress, mimcspongeAddress) {
        voteDeployer = IVoteDeployer(_voteDeployer);
        organization = IOrganization(_organization);
        eventManager = EventManager(_eventManager);
        countOfVotesWithStageOpen = 0;
        stage = GeneralMeetingStage.Created;
        chairperson = _chairperson;
        startDate = _startDate;
        endDate = _endDate;
        metaDataHash = _metaDataHash;
        isVisible = false;
    }

    // MEETING OPTIONS

    function toggleVisibility()
    external
    onlyByChairpersonOrDirector
    onlyAtStages(
        GeneralMeetingStage.Created,
        GeneralMeetingStage.MeetingClosed
    )
    {
        isVisible = !isVisible;
        eventManager.changedMeeting(address(this));
    }

    function changeMeetingDetails(
        address _chairperson,
        uint256 _startDate,
        uint256 _endDate,
        bytes32 _metaDataHash
    ) external onlyAtStage(GeneralMeetingStage.Created) onlyByDirector {
        chairperson = _chairperson;
        startDate = _startDate;
        endDate = _endDate;
        metaDataHash = _metaDataHash;
        organization.topUpChairperson(chairperson);
        eventManager.changedMeeting(address(this));
    }

    // REGISTRATION

    function openRegistration() external onlyByChairpersonOrDirector {
        require(stage <= GeneralMeetingStage.MeetingOpen, "G-01");
        registrationOpen = true;
        eventManager.changedMeeting(address(this));
    }

    function closeRegistration() external onlyByChairpersonOrDirector {
        registrationOpen = false;
        eventManager.changedMeeting(address(this));
    }

    // STAGES

    function openMeeting()
    external
    onlyAtStage(GeneralMeetingStage.Created)
    onlyByChairperson
    incrementMeetingStage
    {
        organization.modifyGlobalMeetingStage(1);
        isVisible = true;
        eventManager.changedMeeting(address(this));
    }

    function closeMeeting()
    external
    onlyAtStage(GeneralMeetingStage.MeetingOpen)
    onlyByChairperson
    incrementMeetingStage
    {
        require(countOfVotesWithStageOpen == 0, "G-16");

        organization.modifyGlobalMeetingStage(- 1);
        registrationOpen = false;
        eventManager.changedMeeting(address(this));
    }

    // VOTE

    function createVote(
        bytes32 _metaDataHash,
        bytes32 _attachmentHash,
        bytes32[] calldata _optionHashes,
        bool _anonymousVote
    ) external onlyByChairpersonOrDirector {
        address voteAddress = voteDeployer.newVote(
            address(organization),
            address(this),
            address(eventManager),
            _metaDataHash,
            _attachmentHash,
            _optionHashes,
            _anonymousVote
        );
        votes.push(IVote(voteAddress));
        isVote[voteAddress] = true;
        organization.addVote(voteAddress);
        eventManager.whitelist(voteAddress);
        eventManager.newResolutionDeployed(voteAddress);
        eventManager.changedMeeting(address(this));
    }

    function removeVote(address voteAddress)
    external
    onlyByChairpersonOrDirector
    {
        uint256 index = votes.length;
        for (uint256 i = 0; i < votes.length; i++) {
            if (address(votes[i]) == voteAddress) {
                index = i;
                break;
            }
        }

        require(index != votes.length, "G-02");

        IVote voteToBeRemoved = votes[index];
        require(voteToBeRemoved.stage() == IVote.VoteStage.Created, "G-03");

        votes[index] = votes[votes.length - 1];
        votes.pop();

        isVote[voteAddress] = false;
        eventManager.removeWhitelist(voteAddress);
        eventManager.resolutionRemoved(address(this), voteAddress);
        eventManager.changedMeeting(address(this));
    }

    function incrementVoteStage() external onlyByVote {
        countOfVotesWithStageOpen++;
    }

    function decrementVoteStage() external onlyByVote {
        countOfVotesWithStageOpen--;
    }

    function replaceAccount(
        address oldAccount,
        address newAccount,
        uint256 newSecret
    ) external {
        require(msg.sender == address(organization), "G-04");
        require(countOfVotesWithStageOpen == 0, "G-05");

        //Replace Chairperson
        if (chairperson == oldAccount) {
            chairperson = newAccount;
        }

        if (_isRegistered(oldAccount)) {
            _removeRegisteredMember(oldAccount);
            _addRegisteredMember(newAccount);
        }

        if (_isRepresented(oldAccount)) {
            _removeRepresentedMember(oldAccount);
            _addRepresentedMember(newAccount);

            address representative = representedBy[oldAccount];
            for (uint256 i = 0; i < represents[representative].length; i++) {
                if (represents[representative][i] == oldAccount) {
                    represents[representative][i] = newAccount;
                }
            }
        }

        representedBy[newAccount] = representedBy[oldAccount];
        delete representedBy[oldAccount];

        positionsOfHashedSecretsInTreeOfUser[newAccount] = positionsOfHashedSecretsInTreeOfUser[oldAccount];
        for (
            uint256 i = 0;
            i < positionsOfHashedSecretsInTreeOfUser[newAccount].length;
            i++
        ) {
            _replaceLeaf(
                newSecret,
                positionsOfHashedSecretsInTreeOfUser[newAccount][i]
            );
        }
        delete positionsOfHashedSecretsInTreeOfUser[oldAccount];

        hashedSecrets[newAccount] = newSecret;
        delete hashedSecrets[oldAccount];

        represents[newAccount] = represents[oldAccount];
        for (uint256 i = 0; i < represents[oldAccount].length; i++) {
            address representedUser = represents[oldAccount][i];
            representedBy[representedUser] = newAccount;
        }
        delete represents[oldAccount];

        for (uint256 i = 0; i < votes.length; i++) {
            if (
                votes[i].isExcluded(oldAccount) &&
                votes[i].stage() == IVote.VoteStage.Created
            ) {
                votes[i].replaceExcluded(oldAccount, newAccount);
            }
        }

        eventManager.changedMeeting(address(this));
    }

    function changeVoteOrder(IVote[] calldata newOrder)
        external
        onlyByChairpersonOrDirector
    {
        require(newOrder.length == votes.length, "G-06");
        for (uint256 i = 0; i < newOrder.length; i++) {
            require(isVote[address(newOrder[i])], "G-07");
        }

        votes = newOrder;
        eventManager.changedMeeting(address(this));
    }

    // Modifier and Checks

    function _isMember(address member) internal view override returns (bool) {
        return organization.isMember(member);
    }

    function isChairpersonOrDirectorResponsible(address entityAddress)
        public
        view
    returns (bool)
    {
        if (stage == GeneralMeetingStage.MeetingOpen)
            return entityAddress == chairperson;
        else return organization.isDirector(entityAddress);
    }

    modifier onlyByChairpersonOrDirector() {
        require(isChairpersonOrDirectorResponsible(msg.sender), "G-08");
        _;
    }

    modifier onlyByDirector() override {
        require(organization.isDirector(msg.sender), "G-09");
        _;
    }

    modifier onlyByMember() override {
        require(organization.isMember(msg.sender), "G-10");
        _;
    }

    modifier onlyByChairperson() {
        require(msg.sender == chairperson, "G-11");
        _;
    }

    modifier onlyByVote() override {
        require(isVote[msg.sender], "G-12");
        _;
    }

    modifier onlyAtStage(GeneralMeetingStage _stage) override(Register) {
        require(stage == _stage, "G-13");
        _;
    }

    modifier onlyAtStages(
        GeneralMeetingStage _stage,
        GeneralMeetingStage _stage2
    ) {
        require(stage == _stage || stage == _stage2, "G-14");
        _;
    }

    modifier incrementMeetingStage() {
        _;
        stage = GeneralMeetingStage(uint256(stage) + 1);
    }

    modifier onlyAtOpenRegistration() override {
        require(registrationOpen, "G-15");
        _;
    }

    function changedMeeting() internal override(Register) {
        eventManager.changedMeeting(address(this));
    }

    // GETTERS

    function getVotes() public view returns (IVote[] memory) {
        return votes;
    }

    function getMeetingDto() external view returns (GeneralMeetingDto memory) {
        return GeneralMeetingDto({
        chairperson : chairperson,
        stage : stage,
        registrationOpen : registrationOpen,
        startDate : startDate,
        endDate : endDate,
        votes : votes,
        isVisible : isVisible,
        registeredVoters : _getRegisteredMembers(),
        representees : _getRepresentedMembers(),
        representatives : _getRepresentatives(),
        leaves : _getLeaves(),
        metaDataHash : metaDataHash
        });
    }
}
