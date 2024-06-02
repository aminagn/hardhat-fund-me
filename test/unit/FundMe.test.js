const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.parseEther("1") // 1eth
          // or
          // const sendValue = "1000000000000000000" // 1eth
          beforeEach(async function () {
              // deploy ou FundMe contract
              // using hardhat-deploy
              // const accounts = await ethers.getSigners()
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", function () {
              it("sets the aggregator address correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, await mockV3Aggregator.getAddress())
              })
          })
          describe("fund", function () {
              it("Fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })
              it("updated the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of getFunder", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })
          describe("withdraw", function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })
              it("withdraw ETH from a single founder", async function () {
                  // arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.getAddress())
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // act
                  const transactionResponse = await fundMe.withdraw()
                  const trancationReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = trancationReceipt
                  const gasCost = gasUsed * gasPrice
                  console.log(`GasCost: ${gasCost}`)
                  console.log(`GasUsed: ${gasUsed}`)
                  console.log(`GasPrice: ${gasPrice}`)
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.getAddress()
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // assert
                  assert.equal(endingFundMeBalance, 0)
                  assert(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )
              })
              it("allows us to draw with multiple getFunder", async function () {
                  const accounts = await ethers.getSigners()
                  for (i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.getAddress())
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // act
                  const transactionResponse = await fundMe.withdraw()
                  const trancationReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = trancationReceipt
                  const gasCost = gasUsed * gasPrice
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.getAddress()
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // assert
                  assert.equal(endingFundMeBalance, 0)
                  assert(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )

                  // make sure that the getFunder are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[1]
                  )
                  await expect(
                      fundMeConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })

              // cheaperWithdaw
              it("cheaperWithdraw ETH from a single founder", async function () {
                  // arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.getAddress())
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const trancationReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = trancationReceipt
                  const gasCost = gasUsed * gasPrice
                  console.log(`GasCost: ${gasCost}`)
                  console.log(`GasUsed: ${gasUsed}`)
                  console.log(`GasPrice: ${gasPrice}`)
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.getAddress()
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // assert
                  assert.equal(endingFundMeBalance, 0)
                  assert(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )
              })

              it("cheaperWithdraw testing...", async function () {
                  const accounts = await ethers.getSigners()
                  for (i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.getAddress())
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const trancationReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = trancationReceipt
                  const gasCost = gasUsed * gasPrice
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.getAddress()
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // assert
                  assert.equal(endingFundMeBalance, 0)
                  assert(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  )

                  // make sure that the getFunder are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
          })
      })
