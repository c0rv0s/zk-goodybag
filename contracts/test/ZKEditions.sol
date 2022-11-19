//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

contract ZKEditions {
    event ZKClaim(address recipient);

    function zkClaim(address recipient) external {
        emit ZKClaim(recipient);
    }
}
