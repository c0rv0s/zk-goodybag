//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IGoodyBag {
    function createCollection(uint256 groupId, string memory _uri)
        external
        returns (uint256);

    function mint(address account, uint256 collectionId) external;
}

contract ZKVerifier is Ownable {
    event Claim(uint256 groupId);
    event NewUser(
        uint256 identityCommitment,
        bytes32 username,
        uint256 groupId
    );
    event GroupCreated(
        uint256 groupId,
        uint256 lensPubId,
        uint256 lensProfileId
    );

    ISemaphore public semaphore;
    IGoodyBag public goodyBag;

    mapping(uint256 => bool) public groupIds;
    mapping(uint256 => bytes32) public users;

    constructor(address semaphoreAddress, address goodyBagAddress) {
        semaphore = ISemaphore(semaphoreAddress);
        goodyBag = IGoodyBag(goodyBagAddress);
    }

    function createGroup(
        uint256 groupId,
        string calldata _uri,
        uint256 lensPubId,
        uint256 lensProfileId
    ) external onlyOwner {
        require(!groupIds[groupId], "group already exists");

        groupIds[groupId] = true;
        semaphore.createGroup(groupId, 20, 0, address(this));

        goodyBag.createCollection(groupId, _uri);

        emit GroupCreated(groupId, lensPubId, lensProfileId);
    }

    function joinGroup(
        uint256 identityCommitment,
        bytes32 username,
        uint256 groupId
    ) external onlyOwner {
        require(groupIds[groupId], "group doesn't exist");
        semaphore.addMember(groupId, identityCommitment);

        users[identityCommitment] = username;

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
        require(groupIds[groupId], "group doesn't exist");

        semaphore.verifyProof(
            groupId,
            merkleTreeRoot,
            signal,
            nullifierHash,
            groupId,
            proof
        );

        goodyBag.mint(recipient, groupId);

        emit Claim(groupId);
    }
}
