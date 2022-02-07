/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;
import "../util/List.sol";

contract RepresentedList {
    using List for List.ListStruct;
    List.ListStruct representedList;

    function _isRepresented(address entityAddress)
        internal
        view
        returns (bool)
    {
        return representedList.contains(entityAddress);
    }

    function isRepresented(address entityAddress) external view returns (bool) {
        return representedList.contains(entityAddress);
    }

    function _addRepresentedMember(address entityAddress) internal {
        representedList.add(entityAddress);
    }

    function _removeRepresentedMember(address entityAddress) internal {
        representedList.remove(entityAddress);
    }

    function _getRepresentedMembers() internal view returns (address[] memory) {
        return representedList.list;
    }

    function getRepresentedMembers() external view returns (address[] memory) {
        return representedList.list;
    }

    function _getRepresentedMemberSize() internal view returns (uint256) {
        return representedList.size();
    }

    function getRepresentedMemberSize() external view returns (uint256) {
        return representedList.size();
    }
}
