/**
DecentraVote
Copyright (C) 2018-2022 iteratec
*/
// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.7.1;
pragma experimental ABIEncoderV2;
import "./RegisteredList.sol";
import "./MerkleTree.sol";
import "./RepresentedList.sol";
import "./GeneralMeeting.sol";

abstract contract Register is RegisteredList, MerkleTree, RepresentedList {
    mapping(address => address) public representedBy;
    mapping(address => address[]) public represents;
    mapping(address => uint256[]) positionsOfHashedSecretsInTreeOfUser;
    mapping(uint256 => bool) usedSecret;
    // TODO efficiency
    mapping(address => uint256) hashedSecrets;

    function getHashedSecrets(address[] calldata addresses)
        public
        view
        returns (uint256[] memory)
    {
        uint256[] memory secrets = new uint256[](addresses.length);
        for (uint256 i = 0; i < addresses.length; i++) {
            secrets[i] = hashedSecrets[addresses[i]];
        }
        return secrets;
    }

    function registerForGeneralMeeting(uint256 hashedSecret)
        external
        onlyByMember
        onlyAtOpenRegistration
    {
        require(representedBy[msg.sender] == address(0), "R-01");
        require(usedSecret[hashedSecret] == false, "R-08");
        _addRegisteredMember(msg.sender);
        uint256[]
            memory representativeSecrets = positionsOfHashedSecretsInTreeOfUser[
                msg.sender
            ];
        for (uint256 i = 0; i < representativeSecrets.length; i++) {
            _replaceLeaf(hashedSecret, representativeSecrets[i]);
        }
        _appendLeaf(hashedSecret);
        positionsOfHashedSecretsInTreeOfUser[msg.sender].push(_numberOfLeaves() - 1);
        usedSecret[hashedSecret] == true;
        hashedSecrets[msg.sender] = hashedSecret;
        changedMeeting();
    }

    function grantRepresentation(address voter, address representative)
        external
        onlyAtStage(GeneralMeeting.GeneralMeetingStage.Created)
        onlyByDirector
    {
        require(representedBy[voter] == address(0), "R-02");
        require(representedBy[representative] == address(0), "R-03");
        require(
            positionsOfHashedSecretsInTreeOfUser[voter].length <= 1,
            "R-04"
        );
        require(_isMember(voter), "R-05");
        require(_isMember(representative), "R-06");
        representedBy[voter] = representative;
        represents[representative].push(voter);
        _addRepresentedMember(voter);
        if (_isRegistered(voter)) {
            _replaceLeaf(
                hashedSecrets[representative],
                positionsOfHashedSecretsInTreeOfUser[voter][0]
            );
            positionsOfHashedSecretsInTreeOfUser[representative].push(
                positionsOfHashedSecretsInTreeOfUser[voter][0]
            );
            positionsOfHashedSecretsInTreeOfUser[voter].pop();
        } else {
            _appendLeaf(hashedSecrets[representative]);
            positionsOfHashedSecretsInTreeOfUser[representative].push(
                _numberOfLeaves() - 1
            );
        }
        changedMeeting();
    }

    function removeRepresentative(address voter)
        external
        onlyAtStage(GeneralMeeting.GeneralMeetingStage.Created)
        onlyByDirector
    {
        require(representedBy[voter] != address(0), "R-07");
        address representative = representedBy[voter];
        uint256[]
            memory representativeSecrets = positionsOfHashedSecretsInTreeOfUser[
                representative
            ];
        uint256 pos = representativeSecrets[representativeSecrets.length - 1];
        positionsOfHashedSecretsInTreeOfUser[representative].pop();
        delete representedBy[voter];

        // delete voter from represents list
        for (uint256 i = 0; i < represents[representative].length; i++) {
            if (represents[representative][i] == voter) {
                represents[representative][i] = represents[representative][
                    represents[representative].length - 1
                ];
                represents[representative].pop();
                break;
            }
        }

        _removeRepresentedMember(voter);
        if (_isRegistered(voter)) {
            _replaceLeaf(hashedSecrets[voter], pos);
            positionsOfHashedSecretsInTreeOfUser[voter].push(pos);
        } else {
            _replaceLeaf(0, pos);
        }
        changedMeeting();
    }

    mapping(address => uint) lastIndexOfRepresentative;

    function excludeFromVote(address[] calldata voters, uint[] calldata unregisteredRepresentativePositions) external onlyByVote returns (uint256) {
        _addVersion(msg.sender);
        for (
            uint256 i = 0;
            i < unregisteredRepresentativePositions.length;
            i++
        ) {
            _replaceLeafInVersion(
                msg.sender,
                1,
                unregisteredRepresentativePositions[i]
            );
        }

        for (uint i = 0; i < voters.length; i++) {
            address voter = voters[i];
            for (
                uint256 j = 0;
                j < positionsOfHashedSecretsInTreeOfUser[voter].length;
                j++
            ) {
                _replaceLeafInVersion(
                    msg.sender,
                    1,
                    positionsOfHashedSecretsInTreeOfUser[voter][j]
                );
            }
            if(_isRepresented(voter)) {
                address representative = representedBy[voter];
                if (lastIndexOfRepresentative[representative] == 0) {
                    lastIndexOfRepresentative[representative] = positionsOfHashedSecretsInTreeOfUser[representative].length - 1;
                } else {
                    lastIndexOfRepresentative[representative] = lastIndexOfRepresentative[representative] - 1;
                }
                _replaceLeafInVersion(msg.sender, 1, positionsOfHashedSecretsInTreeOfUser[representative][lastIndexOfRepresentative[representative]]);
            }
        }
        for (uint i = 0; i < voters.length; i++) {
            if(_isRepresented(voters[i])) {
                delete lastIndexOfRepresentative[representedBy[voters[i]]];
            }
        }

        changedMeeting();
        return _getRootOfVersion(msg.sender);
    }

    // used from Ballotbox which calls vote.getNumberOfVotingRights()
    // to determine if a voter is allowed to cast further votes
    // only callable from Vote
    function getNumberOfVotingRights(address voter) external view onlyByVote() returns (uint256) {
        // if not registered return 0 voteRights
        if (!_isRegistered(voter)) return 0;

        uint256 numberOfRights;
        // limit = the amount of secrets from a vote
        uint256 limit = _numberOfLeaves(msg.sender);

        // if the root of a vote is the same as the generalMeeting, return the amount of secrets from the voter
        if (_getRootOfVersion(msg.sender) == merkleRoot) {
            return positionsOfHashedSecretsInTreeOfUser[voter].length;
        } else {
            // for all the secrets from a voter in the tree
            for (uint256 i = 0; i < positionsOfHashedSecretsInTreeOfUser[voter].length; i++) {
                if (positionsOfHashedSecretsInTreeOfUser[voter][i] < limit)
                    // check if the secret is saved in changedHashes[current Vote][ tree level = 0][position of secret]
                    if (changedHashes[msg.sender][0][positionsOfHashedSecretsInTreeOfUser[voter][i]] != 1)
                        numberOfRights++;
            }
            return numberOfRights;
        }
    }

    function getNumberOfPotentialVotingRights(address member)
        external
        view
        returns (uint256)
    {
        return _getNumberOfPotentialVotingRights(member);
    }

    function _getNumberOfPotentialVotingRights(address member)
        internal
        view
        returns (uint256 numberOfRights)
    {
        if (!_isMember(member)) return 0;
        numberOfRights = positionsOfHashedSecretsInTreeOfUser[member].length;
        if (!_isRegistered(member)) numberOfRights++;
    }

    function _isMember(address member) internal view virtual returns (bool);

    modifier onlyByDirector() virtual {
        _;
    }

    modifier onlyByMember() virtual {
        _;
    }

    modifier onlyByVote() virtual {
        _;
    }

    modifier onlyAtOpenRegistration() virtual {
        _;
    }

    modifier onlyAtStage(GeneralMeeting.GeneralMeetingStage stage) virtual {
        _;
    }

    function changedMeeting() internal virtual;

    // GETTERS

    function _getRepresentatives() internal view returns (address[] memory) {
        address[] memory representedMembers = _getRepresentedMembers();
        uint256 size = representedMembers.length;
        address[] memory representations = new address[](size);

        for (uint256 i = 0; i < size; i++) {
            address representee = representedMembers[i];
            representations[i] = representedBy[representee];
        }
        return representations;
    }
}
