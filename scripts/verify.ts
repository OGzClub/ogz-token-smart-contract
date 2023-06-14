import { run } from "hardhat";
import {
    deployedAddress,
    multisigOwnerAddress,
    poolsData,
    referenceFee,
    taxManager
} from "./constants";

async function main() {

    await run("verify:verify", {
        address: deployedAddress,
        constructorArguments: [
            multisigOwnerAddress,
            taxManager,
            referenceFee,
            poolsData,
        ],
        contract: `contracts/OGZToken.sol:OGzClub`,
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

