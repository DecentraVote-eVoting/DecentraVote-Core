/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;

abstract contract IOrganization {
    function topUpChairperson(address user) external virtual;

    function addVote(address vote) external virtual;

    function hasAccess(bytes32 hash, bytes memory signature)
        public
        view
        virtual
        returns (bool);

    function getGeneralMeetingList() external virtual returns (address[] memory);

    function modifyGlobalMeetingStage(int8 modification) external virtual;

    function reserveIndex(uint256 root)
        external
        virtual
        returns (uint256 index);

    function incrementLastIndex(uint256 root) public virtual;

    // UserList

    function invalidateUser(address entityAddress) external virtual;

    function getUser()
        external
        view
        virtual
        returns (
            address[] memory,
            bytes32[] memory,
            uint8[] memory
        );

    function isUser(address entityAddress) external view virtual returns (bool);

    function addUser(
        address entityAddress,
        bytes32 hashedClaim,
        uint8 role
    ) external virtual;

    function addUsers(
        address[] memory entityAddresses,
        bytes32[] memory userClaims,
        uint8[] memory roles
    ) external virtual;

    function getUserSize() external view virtual returns (uint256);

    function setClaimHash(address entityAddress, bytes32 hashedClaim)
        external
        virtual;

    function isGuest(address entityAddress)
        external
        view
        virtual
        returns (bool);

    function addGuestRole(address entityAddress) external virtual;

    function isMember(address entityAddress)
        external
        view
        virtual
        returns (bool);

    function addMembers(
        address[] memory entityAddresses,
        bytes32[] memory userClaims
    ) external virtual;

    function addMemberRole(address entityAddress) external virtual;

    function isDirector(address entityAddress)
        external
        view
        virtual
        returns (bool);

    function addDirectorRole(address entityAddress) external virtual;

    function removeDirectorRole(address entityAddress) external virtual;

    function getUserRole(address user) external view virtual returns (uint8);

    // Storage

    function isStorage(address entityAddress)
        external
        view
        virtual
        returns (bool);

    function addStorage(address storageAddress, string calldata url)
        external
        virtual;

    function removeStorage(address entityAddress) external virtual;

    function getStorageServices()
        external
        view
        virtual
        returns (address[] memory);

    function getStorageServiceSize() external view virtual returns (uint256);

    // BallotBox

    function _isBallotBox(address entityAddress)
        internal
        view
        virtual
        returns (bool);

    function isBallotBox(address entityAddress)
        external
        view
        virtual
        returns (bool);

    function addBallotBox(address relayAddress, string calldata url)
        external
        virtual;

    function removeBallotBox(address entityAddress) external virtual;

    function getRelayServices()
        external
        view
        virtual
        returns (address[] memory);

    function getRelayServiceSize() external view virtual returns (uint256);
}
