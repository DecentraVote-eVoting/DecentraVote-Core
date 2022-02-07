/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;
import "./Crypto.sol";

abstract contract MerkleTree is Crypto {
    uint256 levels;
    uint256[][] hashes;
    uint256[] zeros;
    uint256 public merkleRoot;
    mapping(address => uint256) numberOfLeaves;
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) changedHashes; // changedHashes[v][l][p] = hash at level l and position p in version v

    constructor(uint256 _levels) {
        levels = _levels;
        uint256 zero = 0;
        for (uint256 l = 0; l <= levels; l++) {
            uint256[] memory a;
            hashes.push(a);
            zeros.push(zero);
            zero = mimcspongeMultihash([zero, zero]);
        }
        merkleRoot = zeros[levels];
    }

    function _addVersion(address version) internal {
        numberOfLeaves[version] = hashes[0].length;
        changedHashes[version][levels][0] = merkleRoot;
    }

    function _getLeaves() internal view returns (uint256[] memory) {
        return hashes[0];
    }

    // This is only meant to be used as a view as it would have significant side effects otherwise.
    function _getLeavesOfVersion(address version)
        internal
        view
        returns (uint256[] memory leaves)
    {
        leaves = hashes[0];
        uint256 size = numberOfLeaves[version];
        for (uint256 i = 0; i < size; i++)
            if (changedHashes[version][0][i] >= 1)
                leaves[i] = changedHashes[version][0][i];
        uint256 length = leaves.length;
        for (uint256 i = length - 1; i >= size; i--) delete leaves[i];
    }

    function getLeavesOfVersion(address version)
        external
        view
        returns (uint256[] memory emptyArray)
    {
        require(version != address(0), "M-01");
        if (numberOfLeaves[version] == 0) {
            // this should only be the case if no one registered for the meeting in time before the vote was opened
            return emptyArray;
        } else {
            return _getLeavesOfVersion(version);
        }
    }

    function _numberOfLeaves() internal view returns (uint256) {
        return hashes[0].length;
    }

    function _numberOfLeaves(address version) internal view returns (uint256) {
        return numberOfLeaves[version];
    }

    function _appendLeaf(uint256 hash) internal {
        bool append = true;
        for (uint256 l = 0; l <= levels; l++) {
            if (append) hashes[l].push(hash);
            else hashes[l][hashes[l].length - 1] = hash;
            if ((hashes[l].length % 2) == 1) {
                hash = mimcspongeMultihash([hash, zeros[l]]);
            } else {
                hash = mimcspongeMultihash(
                    [hashes[l][hashes[l].length - 2], hash]
                );
                append = false;
            }
        }
        merkleRoot = hashes[levels][0];
    }

    function _replaceLeafInVersion(
        address version,
        uint256 hash,
        uint256 pos
    ) internal {
        for (uint256 l = 0; l <= levels; l++) {
            changedHashes[version][l][pos] = hash;
            if ((pos % 2) == 1) {
                if (changedHashes[version][l][pos - 1] != 0)
                    hash = mimcspongeMultihash(
                        [changedHashes[version][l][pos - 1], hash]
                    );
                else hash = mimcspongeMultihash([hashes[l][pos - 1], hash]);
            } else {
                if (pos == (hashes[l].length - 1))
                    hash = mimcspongeMultihash([hash, zeros[l]]);
                else if (changedHashes[version][l][pos + 1] != 0)
                    hash = mimcspongeMultihash(
                        [hash, changedHashes[version][l][pos + 1]]
                    );
                else hash = mimcspongeMultihash([hash, hashes[l][pos + 1]]);
            }
            pos = pos / 2;
        }
    }

    function _replaceLeaf(uint256 hash, uint256 pos) internal {
        for (uint256 l = 0; l <= levels; l++) {
            hashes[l][pos] = hash;
            if ((pos % 2) == 1) {
                hash = mimcspongeMultihash([hashes[l][pos - 1], hash]);
            } else {
                if (pos == (hashes[l].length - 1))
                    hash = mimcspongeMultihash([hash, zeros[l]]);
                else hash = mimcspongeMultihash([hash, hashes[l][pos + 1]]);
            }
            pos = pos / 2;
        }
        merkleRoot = hashes[levels][0];
    }

    function _getRootOfVersion(address version)
        internal
        view
        returns (uint256 rootOfVersion)
    {
        rootOfVersion = changedHashes[version][levels][0];
        if (rootOfVersion == 0) return merkleRoot;
    }

    function _getRoot() internal view returns (uint256) {
        return merkleRoot;
    }
}
