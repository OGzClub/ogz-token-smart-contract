import { ethers } from "hardhat";
import {multisigOwnerAddress, poolsData, referenceFee} from "./constants";

async function deploy() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  const OGZTokenFactory = await ethers.getContractFactory("OGzClub");
  const ogzToken = await OGZTokenFactory.deploy(multisigOwnerAddress, multisigOwnerAddress, referenceFee, poolsData);
  const deployedOgzToken = await ogzToken.deployed();
  console.log(`OGZ deployed to: ${deployedOgzToken.address}`);
}

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
