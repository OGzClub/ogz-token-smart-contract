pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}

contract Pair {
    IERC20 token;

    function initialize(address _token) external {
        token = IERC20(_token);
    }

    function buy(address to) public {
        token.transfer(to, 1 ether);
    }
}
