/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;
pragma experimental ABIEncoderV2;
import "../util/List.sol";

contract TrustlessServiceRegister {
    using List for List.ListStruct;
    List.ListStruct storageServices;
    List.ListStruct ballotBoxServices;

    struct TrustlessService {
        address owner;
        string url;
    }

    mapping(address => TrustlessService) serviceMapping;

    event StorageAdded(
        address indexed owner,
        address indexed storageAddress,
        string storageUrl
    );
    event BallotBoxAdded(
        address indexed owner,
        address indexed ballotBoxAddress,
        string ballotBoxUrl
    );

    function _isStorage(address entityAddress) internal view returns (bool) {
        return storageServices.contains(entityAddress);
    }

    function isStorage(address entityAddress) external view returns (bool) {
        return storageServices.contains(entityAddress);
    }

    /**
    @notice Registers a new storage to the contract
    @dev Adds the address of the new storage to the storageList and then inserts the information to its mapping
    @param storageAddress An ethereum address representing the storage to be added
    @param url A url at which the storage to be added is available
    */
    function addStorage(address storageAddress, string calldata url)
        external
        allowedToRegisterServices
    {
        address currentOwner = serviceMapping[storageAddress].owner;
        require(currentOwner == msg.sender || currentOwner == address(0));
        require(storageAddress != address(0), "T-02");
        storageServices.add(storageAddress);
        serviceMapping[storageAddress].owner = msg.sender;
        serviceMapping[storageAddress].url = url;
        emit StorageAdded(msg.sender, storageAddress, url);
    }

    function removeStorage(address entityAddress)
        external
        allowedToModifyOrganization
    {
        storageServices.remove(entityAddress);
    }

    /**
    @notice Returns a list of all registered storages
    @dev Iterates through all registered storages and fetches their data from their mapping and returns the result
    @return addresses A list of storage addresses
    @return urls A list of urls corresponding to the storage address list
    @return owners A list of owner addresses corresponding to the storage address list
    */
    function getStorageServiceList()
        external
        view
        returns (
            address[] memory,
            string memory,
            address[] memory
        )
    {
        // TODO Maybe rename after other method is gone
        uint256 size = storageServices.size();
        address[] memory addresses = storageServices.getList();
        string memory urls = "";
        address[] memory owners = new address[](size);

        for (uint256 i = 0; i < size; i++) {
            if (i > 0) {
                urls = string(abi.encodePacked(urls, " "));
            }
            urls = string(
                abi.encodePacked(urls, serviceMapping[addresses[i]].url)
            );
            owners[i] = serviceMapping[addresses[i]].owner;
        }

        return (addresses, urls, owners);
    }

    function getStorageServices() external view returns (address[] memory) {
        return storageServices.getList();
    }

    function getStorageServiceSize() external view returns (uint256) {
        return storageServices.size();
    }

    // BallotBox

    function _isBallotBox(address entityAddress) internal view returns (bool) {
        return ballotBoxServices.contains(entityAddress);
    }

    function isBallotBox(address entityAddress) external view returns (bool) {
        return ballotBoxServices.contains(entityAddress);
    }

    function addBallotBox(address ballotBoxAddress, string calldata url)
        external
        allowedToRegisterServices
    {
        address currentOwner = serviceMapping[ballotBoxAddress].owner;
        require(currentOwner == msg.sender || currentOwner == address(0));
        ballotBoxServices.add(ballotBoxAddress);
        serviceMapping[ballotBoxAddress].owner = msg.sender;
        serviceMapping[ballotBoxAddress].url = url;
        emit BallotBoxAdded(msg.sender, ballotBoxAddress, url);
    }

    function removeBallotBox(address entityAddress)
        external
        allowedToModifyOrganization
    {
        ballotBoxServices.remove(entityAddress);
    }

    function getBallotBoxServices() external view returns (address[] memory) {
        return ballotBoxServices.getList();
    }

    function getBallotboxServiceList()
        external
        view
        returns (
            address[] memory,
            string memory,
            address[] memory
        )
    {
        // TODO Maybe rename after other method is gone
        uint256 size = ballotBoxServices.size();
        address[] memory addresses = ballotBoxServices.getList();
        string memory urls = "";
        address[] memory owners = new address[](size);

        for (uint256 i = 0; i < size; i++) {
            if (i > 0) {
                urls = string(abi.encodePacked(urls, " "));
            }
            urls = string(
                abi.encodePacked(urls, serviceMapping[addresses[i]].url)
            );
            owners[i] = serviceMapping[addresses[i]].owner;
        }

        return (addresses, urls, owners);
    }

    function getBallotBoxServiceSize() external view returns (uint256) {
        return ballotBoxServices.size();
    }

    modifier allowedToModifyOrganization() virtual {
        _;
    }
    modifier allowedToRegisterServices() virtual {
        _;
    }
}
