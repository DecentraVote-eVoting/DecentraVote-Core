/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;

abstract contract MiMCContract {
    function MiMCpe7(uint256 in_x, uint256 in_k)
        public
        pure
        virtual
        returns (uint256 out_x);
}

abstract contract MiMCSpongeContract {
    function MiMCSponge(
        uint256 xL_in,
        uint256 xR_in,
        uint256 k
    ) public pure virtual returns (uint256 xL, uint256 xR);
}

contract Crypto {
    MiMCContract mimc;
    MiMCSpongeContract mimcsponge;

    constructor(address mimcAddress, address mimcspongeAddress) {
        mimc = MiMCContract(mimcAddress);
        mimcsponge = MiMCSpongeContract(mimcspongeAddress);
    }

    function mimc7(
        uint256 x /*pure*/
    ) public view returns (uint256 r) {
        r = mimc.MiMCpe7(x, 0);
    }

    function mimcspongeHash(
        uint256 xL,
        uint256 xR /*pure*/
    ) public view returns (uint256 l, uint256 r) {
        (l, r) = mimcsponge.MiMCSponge(xL, xR, 0);
    }

    // calculates mimcsponge.multiHash() for two inputs arr=[l, r] and numOutputs=1 and key=0
    function mimcspongeMultihash(
        uint256[2] memory arr /*pure*/
    ) public view returns (uint256) {
        (uint256 SL, uint256 SR) = mimcspongeHash(arr[0], 0);
        uint256 R = SL + arr[1];
        (SL, SR) = mimcspongeHash(R, SR);
        return SL;
    }

    function verifyMerkleProof(
        uint256 leaf,
        uint256 root,
        uint256[10] memory proof,
        uint256[10] memory directions /*pure*/
    ) public view returns (bool) {
        uint256 hash = leaf;
        for (uint256 l = 0; l < 10; l++) {
            if (directions[l] == 0)
                hash = mimcspongeMultihash([hash, proof[l]]);
            else hash = mimcspongeMultihash([proof[l], hash]);
        }
        return (hash == root);
    }

    function calculateMerkleRoot(
        uint256[] memory hash /*pure*/
    ) public view returns (uint256) {
        uint256 zero = 0;
        for (uint256 l = 0; l < 10; l++) {
            uint256[] memory h = new uint256[](
                hash.length / 2 + (hash.length % 2)
            );
            for (uint256 i = 0; i < hash.length / 2; i++)
                h[i] = mimcspongeMultihash([hash[i * 2], hash[i * 2 + 1]]);
            if (hash.length % 2 == 1)
                h[h.length - 1] = mimcspongeMultihash(
                    [hash[hash.length - 1], zero]
                );
            hash = h;
            zero = mimcspongeMultihash([zero, zero]);
        }
        return hash[0];
    }

    // generator of the bn128 curve
    uint256 public constant gx = 0x1;
    uint256 public constant gy = 0x2;

    function publicKeyTest(uint256 privateKey)
        public
        view
        returns (uint256[2] memory publicKey)
    {
        return ecmul(gx, gy, privateKey);
    }

    function ecmul(
        uint256 px,
        uint256 py,
        uint256 s
    ) public view returns (uint256[2] memory p) {
        uint256[3] memory input;
        input[0] = px;
        input[1] = py;
        input[2] = s;
        assembly {
            if iszero(staticcall(gas(), 0x07, input, 0x60, p, 0x40)) {
                revert(0, 0)
            }
        }
        return p;
    }

    function decryptValue(
        uint256 privateKey,
        uint256[2] memory publicKey,
        uint256 hashedValue,
        uint256 maxValue
    ) public view returns (uint256 value) {
        uint256[2] memory p = ecmul(publicKey[0], publicKey[1], privateKey);
        uint256 h = mimcspongeMultihash([p[0], p[1]]);
        while ((h != hashedValue) && (value <= maxValue)) {
            h = mimc7(h);
            value++;
        }
    }
}
