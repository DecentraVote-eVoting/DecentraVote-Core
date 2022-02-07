/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;
import "../util/List.sol";

contract RegisteredList {
    using List for List.ListStruct;
    List.ListStruct registeredList;

    function _isRegistered(address entityAddress) internal view returns (bool) {
        return registeredList.contains(entityAddress);
    }

    function isRegistered(address entityAddress) external view returns (bool) {
        return registeredList.contains(entityAddress);
    }

    function _addRegisteredMember(address entityAddress) internal {
        registeredList.add(entityAddress);
    }

    function _removeRegisteredMember(address entityAddress) internal {
        registeredList.remove(entityAddress);
    }

    function _getRegisteredMembers() internal view returns (address[] memory) {
        return registeredList.list;
    }

    function getRegisteredMembers() external view returns (address[] memory) {
        return registeredList.list;
    }

    function getRegisteredMemberSize() external view returns (uint256) {
        return registeredList.size();
    }
}
