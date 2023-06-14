const { expect } = require("chai");
const { ethers } = require("hardhat");
import { Contract, Signer } from 'ethers';
import RouterV2 from '../abis/RouterV2.json';


describe('OGZToken',  () => {
    const routerAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
    let routerContract;
    const transferAmount = ethers.utils.parseEther('1');
    const deadline = Math.floor(Date.now() / 1000 + 300);
    let weth;
    let amountOut;
    let amountOutMin;
    let deployer: Signer;
    let user1: Signer;
    let user2: Signer;
    let user3: Signer;
    let owner1: Signer;
    let owner2: Signer;
    let owner3: Signer;
    let multisigOwner: Signer;
    let feeCollector: Signer;
    let feeCollector1: Signer;
    let feeCollector2: Signer;
    let feeCollector3: Signer;
    let feeCollector4: Signer;
    let OGZToken: Contract;
    let testContract: Contract;
    beforeEach(async () => {
        const signers = await ethers.getSigners();
        deployer = signers[0];
        user1 = signers[1];
        user2 = signers[2];
        user3 = signers[3];
        owner1 = signers[8];
        owner2 = signers[9];
        owner3 = signers[10];
        multisigOwner = signers[11];
        feeCollector = signers[3];
        feeCollector1 = signers[4];
        feeCollector2 = signers[5];
        feeCollector3 = signers[7];
        feeCollector4 = signers[12];
        const OGZTokenFactory = await ethers.getContractFactory('contracts/OGzClub.sol:OGzClub');
        const poolData = [
            { poolAddress: await feeCollector.getAddress(), taxRate: 100 },
            { poolAddress: await owner1.getAddress(), taxRate: 100 },
            { poolAddress: await owner2.getAddress(), taxRate: 100 },
            { poolAddress: await owner3.getAddress(), taxRate: 100 },
            { poolAddress: await feeCollector2.getAddress(), taxRate: 200},
            { poolAddress: await feeCollector3.getAddress(), taxRate: 100 },
            { poolAddress: await feeCollector4.getAddress(), taxRate: 100 },

        ];
        OGZToken = await OGZTokenFactory.deploy(deployer.getAddress(), deployer.getAddress(), "100", poolData);
        routerContract = await ethers.getContractAt(RouterV2, routerAddress);
        weth = await routerContract.WETH();
        await OGZToken.deployed();

    });
    // Deployment aşamasında initial supply doğru oluşmalı
    beforeEach('Should properly assign initial supply', async () => {
        const initialSupply = await OGZToken.totalSupply();
        const ownerBalance = await OGZToken.balanceOf(await deployer.getAddress());
        expect(ownerBalance.toString()).to.equal(initialSupply);
    });

    beforeEach('Should properly add liquidity', async () => {
        await OGZToken.connect(deployer).approve(routerAddress, '118000000000000000000000000000');
        await routerContract.connect(deployer).addLiquidityETH(
            OGZToken.address,
            '76216666705000000000000000000',
            '76216666705000000000000000000',
            '39000000000000000000',
            deployer.getAddress(),
            deadline,
            {value: '39000000000000000000'}
        )
        const temp = await routerContract.getAmountsOut(transferAmount, [weth, OGZToken.address]);
        amountOut = temp[1];
        amountOutMin = amountOut.sub(amountOut.mul(8).div(100));
        await OGZToken.connect(user2).approve(routerAddress, amountOut);
        await OGZToken.connect(deployer).enableTrading();

    });

    //Normal transferlerde tax fee almamalı
    it('Should properly transfer tokens without tax fee', async () => {
        const user1Address = await user1.getAddress();
        await OGZToken.connect(deployer).transfer(user1Address, transferAmount);
        const user1Balance = await OGZToken.balanceOf(user1Address);
        expect(user1Balance.toString()).to.equal(transferAmount.toString());
    });
    //Farklı kontratlar execute edince tax fee kesmeli
    it('Should properly transfer tokens with tax fee', async () => {
        const user2Address = await user2.getAddress();
        await routerContract.connect(user2).swapExactETHForTokensSupportingFeeOnTransferTokens(
            amountOutMin,
            [weth, OGZToken.address],
            user2Address,
            deadline,
            {value: transferAmount}
        )
        const userBalanceAfter = await OGZToken.balanceOf(user2Address);
        expect(userBalanceAfter.toString()).to.equal(amountOutMin.toString());
    });

    //Referans komisyonları doğru gitmeli
    it('Should properly add and use referral', async () => {
        const user1Address = await user1.getAddress();
        const user2Address = await user2.getAddress();
        await OGZToken.connect(deployer).transfer(user2Address, transferAmount);
        await OGZToken.connect(deployer).addPreferredNicknames([user1Address]);
        await OGZToken.connect(user1).createNickname("user1");
        const referralCode = await OGZToken.getNickname(user1Address);
        await OGZToken.connect(user2).addReferral(referralCode);
        await OGZToken.connect(user2).approve(routerAddress, amountOut);

        await routerContract.connect(user2).swapExactETHForTokensSupportingFeeOnTransferTokens(
            amountOutMin,
            [weth, OGZToken.address],
            user2Address,
            deadline,
            {value: transferAmount}
        )
        const referralBonus = amountOut.mul(1).div(100);
        const user1Balance = await OGZToken.balanceOf(user1Address);
        expect(user1Balance.toString()).to.equal(referralBonus.toString());
    });
    //Aynı adres üst üste referans ekleyememeli
    it('Should not allow the same address to add multiple referrals', async () => {
        const user1Address = await user1.getAddress();
        const user3Address = await user3.getAddress();
        const user2Address = await user2.getAddress();
        await OGZToken.connect(deployer).addPreferredNicknames([user1Address, user3Address]);
        await OGZToken.connect(user1).createNickname('user1');
        const referralCode = await OGZToken.getNickname(user1Address);
        await OGZToken.connect(user2).addReferral(referralCode);
        await expect(OGZToken.connect(user2).addReferral(referralCode)).to.be.revertedWith(
            'Invalid referral'
        );
        await OGZToken.connect(user3).createNickname('user3');
        const newReferralCode = await OGZToken.getNickname(user3Address);
        await expect(OGZToken.connect(user2).addReferral(newReferralCode)).to.be.revertedWith(
            'Invalid referral'
        );
    });

    it('Should properly toggle tax fees', async () => {
        const user2Address = await user2.getAddress();
        //Pool id 4's tax rate is 2%, total tax rate = 8, without pool id tax rate new total tax rate is 6
        await OGZToken.connect(deployer).toggleOffBuyTaxFee(4);
        await routerContract.connect(user2).swapExactETHForTokensSupportingFeeOnTransferTokens(
            amountOutMin,
            [weth, OGZToken.address],
            user2Address,
            deadline,
            {value: transferAmount}
        )
        const userBalanceAfter = await OGZToken.balanceOf(user2Address);
        //6 is new total tax rate
        const withoutTaxFee = amountOut.sub(amountOut.mul(6).div(100));
        expect(userBalanceAfter.toString()).to.equal(withoutTaxFee.toString());
    });
    it('Should not send commision to referrer after toggle off', async () => {
        const user2Address = await user2.getAddress();
        await OGZToken.connect(deployer).toggleOffBuyTaxFee(6);
        await routerContract.connect(user2).swapExactETHForTokensSupportingFeeOnTransferTokens(
            amountOutMin,
            [weth, OGZToken.address],
            user2Address,
            deadline,
            {value: transferAmount}
        )
        const userBalanceAfter = await OGZToken.balanceOf(user2Address);
        const withoutTaxFee = amountOut.sub(amountOut.mul(7).div(100));
        expect(userBalanceAfter.toString()).to.equal(withoutTaxFee.toString());
    });
    it('Should not allow toggle on tax fees', async () => {
        await OGZToken.connect(deployer).toggleOffBuyTaxFee(4);
        try {
            await OGZToken.connect(deployer).toggleOffBuyTaxFee(4);
            expect(false).to.be.true;
        } catch (error) {
            expect(error.message).to.include("The pool is already toggled off");
        }
    });
    it('Should not toggle for non pool id', async () => {
        await OGZToken.connect(deployer).toggleOffBuyTaxFee(4);
        try {
            await OGZToken.connect(deployer).toggleOffBuyTaxFee(8);
            expect(false).to.be.true;
        } catch (error) {
            expect(error.message).to.include("Pool id not found");
        }
    });
    it('Should properly transfer tokens with tax fee after toggle tax fee', async () => {
        const user1Address = await user1.getAddress();
        const user2Address = await user2.getAddress();
        await OGZToken.connect(deployer).toggleOffSellTaxFee(4);
        await OGZToken.connect(deployer).toggleOffSellTaxFee(6);
        await OGZToken.connect(deployer).addPreferredNicknames([user1Address, user2Address]);
        await OGZToken.connect(user1).createNickname('user1');
        const referralCode = await OGZToken.getNickname(user1Address);
        await OGZToken.connect(user2).addReferral(referralCode);
        await routerContract.connect(user2).swapExactETHForTokensSupportingFeeOnTransferTokens(
            amountOutMin,
            [weth, OGZToken.address],
            user2Address,
            deadline,
            {value: transferAmount}
        )
        const user1Balance = await OGZToken.balanceOf(user1Address);
        expect(user1Balance.toString()).to.equal((amountOut.div(100)).toString());
    });
});
