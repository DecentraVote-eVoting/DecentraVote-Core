/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;

library List {
    struct ListStruct {
        address[] list;
        mapping(address => uint256) listMapping;
    }

    function setList(ListStruct storage data, address[] memory initialMembers)
        internal
    {
        for (uint256 i = 0; i < data.list.length; i++)
            delete data.listMapping[data.list[i]];
        data.list = initialMembers;
        for (uint256 i = 0; i < data.list.length; i++)
            data.listMapping[data.list[i]] = i + 1;
    }

    function contains(ListStruct storage data, address entityAddress)
        internal
        view
        returns (bool)
    {
        return data.listMapping[entityAddress] != 0;
    }

    function add(ListStruct storage data, address entityAddress) internal {
        require(!contains(data, entityAddress), "L-01");
        data.listMapping[entityAddress] = data.list.length + 1;
        data.list.push(entityAddress);
    }

    function remove(ListStruct storage data, address entityAddress) internal {
        require(contains(data, entityAddress), "L-02");
        uint256 pos = data.listMapping[entityAddress] - 1;
        data.list[pos] = data.list[data.list.length - 1];
        data.listMapping[data.list[pos]] = pos + 1;
        data.list.pop();
        delete data.listMapping[entityAddress];
    }

    function size(ListStruct storage data) internal view returns (uint256) {
        return data.list.length;
    }

    function getList(ListStruct storage data)
        internal
        view
        returns (address[] memory)
    {
        return data.list;
    }
}
