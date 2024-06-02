//module.exports = async ({hre}) => {
// or use : const {getNameAccounts, deployments } = hre
// or hre.getNameAccounts() and hre.deployments()
//}

const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { network } = require("hardhat")
const {
    experimentalAddHardhatNetworkMessageTraceHook,
} = require("hardhat/config")
const { from } = require("solhint/lib/config")
const { verify } = require("../utils/verifiy")
require("dotenv").config()

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    //const address = "0x694AA1769357215DE4FAC081bf1f309aDC325306"

    //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]

    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    console.log(ethUsdPriceFeedAddress)

    // when going for localhost or hardhat network we want to use a mock
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }

    log("-------------------------------")
}

module.exports.tags = ["all", "fundme"]
