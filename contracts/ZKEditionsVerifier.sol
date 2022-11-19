//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IZKEditions {
    function zkClaim(address recipient) external;
}

contract ZKEditionsVerifier is Ownable {
    event Claim(address recipient, uint256 groupId);
    event NewUser(
        uint256 identityCommitment,
        bytes32 username,
        uint256 indexed groupId
    );
    event GroupCreated(
        uint256 groupId,
        address collection,
        uint256 lensPubId,
        uint256 lensProfileId
    );

    ISemaphore public semaphore;

    mapping(uint256 => address) public groupIdCollections;

    address constant zeroAddress = address(0);

    constructor(address semaphoreAddress) {
        semaphore = ISemaphore(semaphoreAddress);
    }

    function createGroup(
        uint256 groupId,
        address dcntCollection,
        uint256 lensPubId,
        uint256 lensProfileId
    ) external onlyOwner {
        require(
            groupIdCollections[groupId] == zeroAddress,
            "group already exists"
        );

        groupIdCollections[groupId] = dcntCollection;
        semaphore.createGroup(groupId, 20, 0, address(this));

        emit GroupCreated(groupId, dcntCollection, lensPubId, lensProfileId);
    }

    function joinGroup(
        uint256 identityCommitment,
        bytes32 username,
        uint256 groupId
    ) external onlyOwner {
        require(
            groupIdCollections[groupId] != zeroAddress,
            "group doesn't exist"
        );

        semaphore.addMember(groupId, identityCommitment);

        emit NewUser(identityCommitment, username, groupId);
    }

    function claim(
        uint256 groupId,
        address recipient,
        bytes32 signal,
        uint256 merkleTreeRoot,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external {
        require(
            groupIdCollections[groupId] != zeroAddress,
            "group doesn't exist"
        );

        semaphore.verifyProof(
            groupId,
            merkleTreeRoot,
            signal,
            nullifierHash,
            groupId,
            proof
        );

        IZKEditions(groupIdCollections[groupId]).zkClaim(recipient);

        emit Claim(recipient, groupId);
    }
}
