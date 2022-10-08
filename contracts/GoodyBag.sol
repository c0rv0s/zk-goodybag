//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

error OnlyVerifier();

contract GoodyBag is ERC1155 {
    address internal verifier;
    mapping(uint256 => string) public collections;

    constructor() ERC1155("") {}

    bool internal inited;

    function init(address _verifier) external {
        require(!inited, "!");
        verifier = _verifier;
        inited = true;
    }

    /// @notice create new collection for a club space
    function createCollection(uint256 groupId, string memory _uri)
        external
        onlyVerifier
        returns (uint256)
    {
        require(
            bytes(collections[groupId]).length == 0,
            "collection already exists"
        );
        collections[groupId] = _uri;

        return groupId;
    }

    /// @notice mints to a club space
    function mint(address account, uint256 collectionId) external onlyVerifier {
        _mint(account, collectionId, 1, "");
    }

    /// @notice returns the metadata uri for a given `tokenId`
    function uri(uint256 tokenId) public view override returns (string memory) {
        return collections[tokenId];
    }

    modifier onlyVerifier() {
        if (msg.sender != verifier) revert OnlyVerifier();
        _;
    }
}
