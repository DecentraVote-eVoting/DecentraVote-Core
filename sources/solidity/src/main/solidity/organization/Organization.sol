/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;

import "./TrustlessServiceRegister.sol";
import "../general-meeting/Interfaces/IGeneralMeeting.sol";
import "../general-meeting-deployer/Interfaces/IGeneralMeetingDeployer.sol";
import "../event/EventManager.sol";
import "./UserList.sol";

contract Organization is UserList, TrustlessServiceRegister {
    IGeneralMeeting[] public generalMeetingList;
    IGeneralMeetingDeployer generalMeetingDeployer;
    address voteDeployerAddress;
    EventManager public eventManager;

    address oracle;
    bytes32[] public fileHashes;
    address mimcAddress;
    address mimcSpongeAddress;
    uint256 accountsLeft = 3;
    int8 public globalMeetingStage = 0;
    uint256 initialMemberTopUp;
    uint256 initialDirectorTopUp;
    uint256 initialChairpersonTopUp;
    mapping(address => bool) public isVote;
    mapping(address => bool) isGeneralMeeting;
    // the next unused index of registered anonymous addresses for a particular root available when opening a vote
    mapping(uint256 => uint256) public nextIndexForRoot;
    // the last index which can be used to register anonymous addresses for a particular root
    mapping(uint256 => uint256) public lastIndexForRoot;

    // If this is set to true it enables the contract to be reset
    bool devMode;

    constructor(
        address generalMeetingDeployerAddress,
        address _voteDeployerAddress,
        address _initialDirector,
        address _oracle,
        address _mimcAddress,
        address _mimcSpongeAddress,
        uint256 _initialMemberTopUp,
        uint256 _initialDirectorTopUp,
        uint256 _initialChairpersonTopUp,
        bool _devMode
    ) payable {
        devMode = _devMode;
        if (devMode) {
            require(msg.sender == 0xb984DaF8e8eE81fec527FDcccaD17248361b4912);
        }
        generalMeetingDeployer = IGeneralMeetingDeployer(
            generalMeetingDeployerAddress
        );
        voteDeployerAddress = _voteDeployerAddress;
        oracle = _oracle;
        mimcAddress = _mimcAddress;
        mimcSpongeAddress = _mimcSpongeAddress;
        initialMemberTopUp = _initialMemberTopUp;
        initialDirectorTopUp = _initialDirectorTopUp;
        initialChairpersonTopUp = _initialChairpersonTopUp;
        eventManager = new EventManager();
        _addUser(_initialDirector, 0x00, 4, false);
    }

    receive() external payable {}

    fallback() external payable {}

    function emergencyWithdraw() public allowedToModifyOrganization {
        payable(msg.sender).transfer(address(this).balance);
    }

    function createNewGeneralMeeting(
        uint256 _startDate,
        uint256 _endDate,
        address _chairperson,
        uint256 _levels,
        bytes32 _metaDataHash
    ) external allowedToModifyOrganization {
        address generalMeeting = generalMeetingDeployer.newGeneralMeeting(
            voteDeployerAddress,
            address(this),
            _startDate,
            _endDate,
            _chairperson,
            address(eventManager),
            _metaDataHash,
            _levels,
            mimcAddress,
            mimcSpongeAddress
        );
        generalMeetingList.push(IGeneralMeeting(generalMeeting));
        isGeneralMeeting[generalMeeting] = true;
        eventManager.newGeneralMeetingDeployed(generalMeeting);
        eventManager.whitelist(generalMeeting);

        _topUpChairperson(_chairperson);
    }

    function removeGeneralMeeting(address addressToBeRemoved) external allowedToModifyOrganization {
        uint256 index = generalMeetingList.length;
        for (uint256 i = 0; i < generalMeetingList.length; i++) {
            if (address(generalMeetingList[i]) == addressToBeRemoved) {
                index = i;
                break;
            }
        }
        require(index != generalMeetingList.length, "O-13");

        IGeneralMeeting gmToBeRemoved = generalMeetingList[index];
        require(gmToBeRemoved.stage() == IGeneralMeeting.GeneralMeetingStage.Created, "O-14");
        require(gmToBeRemoved.registrationOpen() == false, "O-15");
        require(gmToBeRemoved.getRegisteredMemberSize() == 0, "O-16");

        generalMeetingList[index] = generalMeetingList[generalMeetingList.length - 1];
        generalMeetingList.pop();

        isGeneralMeeting[addressToBeRemoved] = false;
        eventManager.removeWhitelist(addressToBeRemoved);
        eventManager.removeMeeting(addressToBeRemoved);
    }

    function addVote(address vote) external onlyByGeneralMeeting {
        isVote[vote] = true;
    }

    function topUpUser(address user) external {
        require(_isUser(user), "O-01");
        _topUpUser(user);
    }

    function _topUpUser(address user) internal override(UserList) {
        if (user.balance < initialMemberTopUp)
            payable(user).transfer(initialMemberTopUp);
    }

    function _topUpDirector(address user) internal override(UserList) {
        if (user.balance < initialDirectorTopUp)
            payable(user).transfer(initialDirectorTopUp);
    }

    function topUpChairperson(address user) external onlyByGeneralMeeting {
        _topUpChairperson(user);
    }

    function _topUpChairperson(address user) internal {
        if (user.balance < initialChairpersonTopUp)
            payable(user).transfer(initialChairpersonTopUp);
    }

    function changeOracle(address _oracle)
        external
        payable
        allowedToModifyOrganization
    {
        require(_oracle != address(0), "O-02");
        oracle = _oracle;
        payable(oracle).transfer(msg.value);
    }

    function changeFileHash(bytes32[] calldata _fileHashes)
        external
        allowedToModifyOrganization
    {
        fileHashes = _fileHashes;
    }

    function replaceUser(
        address entityAddress,
        bytes32 hashedClaim,
        address oldEntityAddress,
        uint256 newHashedSecret
    ) external allowedToModifyUserList {
        for (uint256 i = 0; i < generalMeetingList.length; i++) {
            if (generalMeetingList[i].countOfVotesWithStageOpen() != 0) {
                return;
            }
        }

        uint8 role = _getUserRole(oldEntityAddress);
        _editUser(oldEntityAddress, hashedClaim, 0);
        _addUser(entityAddress, hashedClaim, role, true);

        for (uint256 i = 0; i < generalMeetingList.length; i++) {
            generalMeetingList[i].replaceAccount(
                oldEntityAddress,
                entityAddress,
                newHashedSecret
            );
        }
    }

    function modifyGlobalMeetingStage(int8 modification)
        external
        onlyByGeneralMeeting
    {
        globalMeetingStage += modification;
    }

    function emitUserClaim(
        address member,
        bytes32 claimHash,
        uint256 role
    ) internal override(UserList) {
        eventManager.userClaim(member, claimHash, role);
    }

    function emitUserEdited(
        address user,
        bytes32 claimHash,
        uint256 role
    ) internal override(UserList) {
        eventManager.userEdited(user, claimHash, role);
    }

    function reserveIndex(uint256 root)
        external
        onlyByVote
        returns (uint256 index)
    {
        index = nextIndexForRoot[root];
        require(index < lastIndexForRoot[root], "O-03");
        nextIndexForRoot[root]++;
        return index;
    }

    function incrementLastIndex(uint256 root) public onlyByVote {
        lastIndexForRoot[root]++;
    }

    // MODIFIERS

    modifier allowedToModifyOrganization() override {
        require(_isDirector(msg.sender), "O-04");
        _;
    }

    modifier allowedToModifyUserList() override {
        require(
            _isDirector(msg.sender) ||
            msg.sender == oracle ||
            msg.sender == address(this),
                "O-05");
        _;
    }

    modifier allowedToRegisterServices() override(TrustlessServiceRegister) {
        require(_isDirector(msg.sender) || _isMember(msg.sender), "O-06");
        _;
    }

    modifier onlyByGeneralMeeting() {
        require(isGeneralMeeting[msg.sender], "O-08");
        _;
    }

    function noMeetingOpen() internal view override(UserList) returns (bool) {
        return globalMeetingStage == 0;
    }

    modifier onlyByVote() {
        require(isVote[msg.sender], "O-12");
        _;
    }

    modifier onlyInDevMode() override {
        require(devMode);
        _;
    }

    // GETTERS

    function _isOracle(address entityAddress) internal view returns (bool) {
        return entityAddress == oracle;
    }

    function isOracle(address entityAddress) external view returns (bool) {
        return _isOracle(entityAddress);
    }

    function getGeneralMeetingList()
        external
        view
        returns (IGeneralMeeting[] memory)
    {
        return generalMeetingList;
    }

    function getFileHashes() external view returns (bytes32[] memory) {
        return fileHashes;
    }

    // DEV MODE

    function reset(address[] memory entityAddresses, bytes32[] memory userClaims, uint8[] memory roles) external onlyInDevMode {
        eventManager = new EventManager();
        delete generalMeetingList;
        _resetUser();
        for (uint256 i = 0; i < userClaims.length; i++) {
            _addUser(entityAddresses[i], userClaims[i], roles[i], true);
        }
    }
}
