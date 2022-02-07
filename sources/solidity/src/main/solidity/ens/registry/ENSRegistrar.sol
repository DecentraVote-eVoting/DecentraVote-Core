/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.0;

import "../ENS.sol";

/**
 * A registrar that allocates subdomains to the first person to claim them.
 */
contract ENSRegistrar {
    ENS ens;
    bytes32 rootNode;

    modifier only_owner() {
        address currentOwner = ens.owner(rootNode);
        require(currentOwner == msg.sender);
        _;
    }

    /**
     * Constructor.
     * @param ensAddr The address of the ENS registry.
     * @param node The node that this registrar administers.
     */
    constructor(ENS ensAddr, bytes32 node) {
        ens = ensAddr;
        rootNode = node;
    }

    /**
     * Register a name, or change the owner of an existing registration.
     * @param label The hash of the label to register.
     * @param owner The address of the new owner.
     */
    function register(bytes32 label, address owner) public only_owner {
        ens.setSubnodeOwner(rootNode, label, owner);
    }
}
