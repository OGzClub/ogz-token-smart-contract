pragma solidity ^0.8.0;

import "./Pair/pair.sol";

contract TestCaller {
    IERC20 internal OGZTokenAddress;
    address public pair;

    function createPair(address _ogzToken) external returns (address) {
        OGZTokenAddress = IERC20(_ogzToken);
        bytes memory bytecode = type(Pair).creationCode;
        address _pair;
        bytes32 salt = keccak256(abi.encodePacked(address(OGZTokenAddress)));
        assembly {
            _pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        pair = _pair;
        Pair(pair).initialize(address(OGZTokenAddress));
        return pair;
    }

    function buy() external {
        Pair(pair).buy(msg.sender);
    }

    function sell() external {
        OGZTokenAddress.transferFrom(msg.sender, pair, 1 ether);
    }
}
