/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;
import "../util/List.sol";

contract ExcludedList {
    using List for List.ListStruct;
    List.ListStruct excludedMembers;

    function _setExcluded(address[] memory initialMembers) internal {
        excludedMembers.setList(initialMembers);
    }

    function _isExcluded(address entityAddress) internal view returns (bool) {
        return excludedMembers.contains(entityAddress);
    }

    function isExcluded(address entityAddress) external view returns (bool) {
        return excludedMembers.contains(entityAddress);
    }

    function _getExcluded() internal view returns (address[] memory) {
        return excludedMembers.list;
    }

    function getExcluded() external view returns (address[] memory) {
        return excludedMembers.list;
    }

    function _getExcludedSize() internal view returns (uint256) {
        return excludedMembers.size();
    }

    function getExcludedSize() external view returns (uint256) {
        return excludedMembers.size();
    }

    function _removeExcluded(address entityAddress) internal {
        excludedMembers.remove(entityAddress);
    }

    function _addExcluded(address entityAddress) internal {
        excludedMembers.add(entityAddress);
    }
}
