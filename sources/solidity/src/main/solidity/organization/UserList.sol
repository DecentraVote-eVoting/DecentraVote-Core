/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;

abstract contract UserList {

    struct User {
        bytes32 userClaim;
        uint8 role;
    }

    address[] userKeys;

    mapping(address => User) userMapping;
    uint8 numberOfDirectors = 0;

    /*
    * Verifies if a given Role is a valid one
    * @param {uint8} role
    * returns {bool}
    */
    function validateRole(uint8 role) internal pure returns (bool) {
        // 0 none, 1 guest, 2 member, 6 director & member
        return role == 0 || role == 1 || role == 2 || role == 4 || role == 6;
    }

    //====================================================================================================
    // User
    //====================================================================================================

    /*
     * Validates a user by searching for it in the mapping of userAddresses
     * @param {address} entityAddress
     * returns {bool}
     */
    function _isUser(address entityAddress) internal view returns (bool) {
        return userMapping[entityAddress].userClaim != 0x00;
    }

    /*
     * the externally callable equal to _isUser
     * @param {address} entityAddress
     * returns {bool}
     */
    function isUser(address entityAddress) external view returns (bool) {
        return _isUser(entityAddress);
    }

    /*
     * the externally callable equal to _addUser
     * @param {address} entityAddress
     * @param {bytes32} hashedClaim
     * @param {uint8} role
     */
    function addUser(
        address entityAddress,
        bytes32 hashedClaim,
        uint8 role
    ) external allowedToModifyUserList {
        // require needs to be in the external function, because the
        // internal function is called by organization for adding the initial director user
        require(hashedClaim != 0x00, "U-01");
        require(!_isUser(entityAddress), "U-10");
        _addUser(entityAddress, hashedClaim, role, true);
    }

    /*
     * adds a new User to the UserList and also sets hash and role after it is validated
     * topUp only is true when called internally regarding the creation of the initial director
     * @param {address} entityAddress
     * @param {bytes32} hashedClaim
     * @param {uint8} role
     */
    function _addUser(
        address entityAddress,
        bytes32 hashedClaim,
        uint8 role,
        bool topUp
    ) internal {
        require(validateRole(role), "U-02");
        userKeys.push(entityAddress);
        userMapping[entityAddress].userClaim = hashedClaim;
        userMapping[entityAddress].role = role;

        if(_isDirectorRole(role)) {
            numberOfDirectors += 1;
        }

        if (topUp) {
            if(_isDirectorRole(role)) _topUpDirector(entityAddress);
            else _topUpUser(entityAddress);
        }

        emitUserClaim(entityAddress, hashedClaim, role);
    }

    /*
     * adds new Users to the UserList and also sets hash and role by calling add user
     * @param {address[]} entityAddresses
     * @param {bytes32[]} userClaims
     * @param {int[]} roles
     */
    function addUsers(
        address[] memory entityAddresses,
        bytes32[] memory userClaims,
        uint8[] memory roles
    ) external allowedToModifyUserList {
        for (uint256 i = 0; i < userClaims.length; i++) {
            _addUser(entityAddresses[i], userClaims[i], roles[i], true);
        }
    }

    /*
     * returns a list of all users with a valid role by finding them in the mapping of addresses
     * @param {address[] memory} addresses
     * @param {bytes32[] memory} claims
     * @param {uint8[] memory} roles
     */
    function getUser()
        external
        view
        returns (
            address[] memory,
            bytes32[] memory,
            uint8[] memory
        )
    {
        uint256 size = userKeys.length;
        bytes32[] memory claims = new bytes32[](size);
        uint8[] memory roles = new uint8[](size);

        for (uint256 i = 0; i < size; i++) {
            claims[i] = (userMapping[userKeys[i]].userClaim);
            roles[i] = (userMapping[userKeys[i]].role);
        }
        return (userKeys, claims, roles);
    }

    /*
     * returns the length of the UserList
     * returns {uint}
     */
    function getUserSize() external view returns (uint256) {
        return userKeys.length;
    }

    /*
     * returns the role of a specific user
     * param {address} entityAddress
     * returns {uint8}
     */
    function _getUserRole(address entityAddress) internal view returns (uint8) {
        return userMapping[entityAddress].role;
    }

    /*
     * edits/updates the user's hashed claim and role
     * param {address} entityAddress
     * param {bytes32} newHashedClaim
     * param {uint8} newRole
     */
    function _editUser(
        address entityAddress,
        bytes32 newHashedClaim,
        uint8 newRole
    ) internal {
        require(validateRole(newRole), "U-03");
        require(newHashedClaim != 0x00, "U-09");
        if(!noMeetingOpen()) {
            require(userMapping[entityAddress].role == newRole, "U-12");
        }
        if (_isDirector(entityAddress) && !_isDirectorRole(newRole)) {
            require(numberOfDirectors != 1, "U-11");
            numberOfDirectors -= 1;
        } else if(!_isDirector(entityAddress) && _isDirectorRole(newRole)) {
            numberOfDirectors += 1;
        }

        userMapping[entityAddress].role = newRole;
        userMapping[entityAddress].userClaim = newHashedClaim;
        emitUserEdited(entityAddress, newHashedClaim, newRole);
    }

    /*
     * the externally callable equal to _editUser
     * param {address} userAddress
     * param {bytes32} claimHash
     * param {uint8} role
     */
    function editUser(
        address userAddress,
        bytes32 claimHash,
        uint8 role
    ) external allowedToModifyUserList {
        return _editUser(userAddress, claimHash, role);
    }

    /*
     * sets the hashed claim for a user if the hashedClaim exists.
     * this is/should only used with the initial account that needs to be set as a director before it has a claim hash
     * @param {address} entityAddress
     * @param {bytes32} hashedClaim
     */
    function setClaimHash(address entityAddress, bytes32 hashedClaim)
        external
        allowedToModifyUserList
    {
        require(hashedClaim != 0x00, "U-04");
        userMapping[entityAddress].userClaim = hashedClaim;
    }

    //====================================================================================================
    // Guest
    //====================================================================================================

    /*
     * Validates a Guest by checking if its role is valid (1 is Guest and > 0 for a boolean comparison)
     * @param {address} entityAddress
     * returns {bool}
     */
    function _isGuest(address entityAddress) internal view returns (bool) {
        return (userMapping[entityAddress].role & 1) > 0;
    }

    /*
    * the externally callable equal to _isGuest
    * @param {address} entityAddress
    * returns {bool}
    */
    function isGuest(address entityAddress) external view returns (bool) {
        return _isGuest(entityAddress);
    }

    //====================================================================================================
    // Member
    //====================================================================================================

    /*
    * Validates a Member by checking if its role is valid (2 is Member and > 0 for a boolean comparison)
    * @param {address} entityAddress
    * returns {bool}
    */
    function _isMember(address entityAddress) internal view returns (bool) {
        return (userMapping[entityAddress].role & 2) > 0;
    }

    /*
    * the externally callable equal to _isMember
    * @param {address} entityAddress
    * returns {bool}
    */
    function isMember(address entityAddress) external view returns (bool) {
        return _isMember(entityAddress);
    }

    /*
     * adds a new Member to the UserList and also sets hash and role by calling add member with a fixed member role
     * @param {address[]} entityAddresses
     * @param {bytes32[]} userClaims
     */
    function addMembers(
        address[] memory entityAddresses,
        bytes32[] memory userClaims
    ) external allowedToModifyUserList {
        for (uint256 i = 0; i < userClaims.length; i++) {
            _addUser(entityAddresses[i], userClaims[i], 2, true);
        }
    }

    //====================================================================================================
    // Director
    //====================================================================================================

    /*
    * Validates a Director by checking if its role is valid (4 is Director and > 0 for a boolean comparison)
    * @param {address} entityAddress
    * returns {bool}
    */
    function _isDirector(address entityAddress) internal view returns (bool) {
        return (userMapping[entityAddress].role & 4) > 0;
    }

    function _isDirectorRole(uint256 role) internal pure returns (bool) {
        return (role & 4) > 0;
    }

    /*
    * the externally callable equal to _isDirector
    * @param {address} entityAddress
    * returns {bool}
    */
    function isDirector(address entityAddress) external view returns (bool) {
        return _isDirector(entityAddress);
    }

    //====================================================================================================
    // Modifier
    //====================================================================================================

    modifier allowedToModifyUserList() virtual {
        _;
    }

    //====================================================================================================
    // Virtual Functions
    //====================================================================================================

    function _topUpUser(address user) internal virtual {}
    function _topUpDirector(address user) internal virtual {}

    function emitUserClaim(
        address member,
        bytes32 claimHash,
        uint256 role
    ) internal virtual;

    function emitUserEdited(
        address user,
        bytes32 claimHash,
        uint256 role
    ) internal virtual;

    function noMeetingOpen() internal view virtual returns (bool) {
        return true;
    }

    //====================================================================================================
    // Getter
    //====================================================================================================

    function getUserRole(address user) external view returns (uint8) {
        return userMapping[user].role;
    }

    //====================================================================================================
    // e2e
    //====================================================================================================
    function _resetUser() internal onlyInDevMode {
        for (uint i = 0; i < userKeys.length; i++) {
            delete userMapping[userKeys[i]];
        }
        delete userKeys;
        numberOfDirectors = 0;
    }

    modifier onlyInDevMode() virtual {_;}

}
