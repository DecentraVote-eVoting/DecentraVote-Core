/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;

library DataList {
    struct Data {
        address id;
        bytes32 data;
    }

    struct ListStruct {
        Data[] list;
        mapping(address => uint256) listMapping;
    }

    function setList(ListStruct storage data, Data[] memory initialMembers)
        internal
    {
        require(data.list.length == 0, "U-05");
        data.list = initialMembers;
        for (uint256 i = 0; i < data.list.length; i++)
            data.listMapping[data.list[i].id] = i + 1;
    }

    function contains(ListStruct storage data, address entityAddress)
        internal
        view
        returns (bool)
    {
        return data.listMapping[entityAddress] != 0;
    }

    function add(ListStruct storage data, Data memory entityData) internal {
        require(!contains(data, entityData.id), "U-06");
        data.listMapping[entityData.id] = data.list.length + 1;
        data.list.push(entityData);
    }

    function remove(ListStruct storage data, address entityAddress) internal {
        require(contains(data, entityAddress), "U-07");
        uint256 pos = data.listMapping[entityAddress] - 1;
        data.list[pos] = data.list[data.list.length - 1];
        data.listMapping[data.list[pos].id] = pos + 1;
        data.list.pop();
        delete data.listMapping[entityAddress];
    }

    function update(
        ListStruct storage data,
        address entityAddress,
        bytes32 updateData
    ) internal {
        require(contains(data, entityAddress), "U-08");
        data.list[data.listMapping[entityAddress]].data = updateData;
    }

    function size(ListStruct storage data) internal view returns (uint256) {
        return data.list.length;
    }
}
