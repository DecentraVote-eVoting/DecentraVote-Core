/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
const path = require("path");
const ethers = require("ethers");
const nonceManager = require("@ethersproject/experimental/lib/nonce-manager");
const sender = require("./fileSender.js");
const utils = require("./utils.js");
const fileReader = require("./fileReader.js");
const fileWriter = require("./fileWriter.js");

utils.printSeperator();
utils.printSeperator();
console.log(">>>>>>>>>>>>DECENTRAVOTE<<<<<<<<<<<<")
console.log(">>>>>>>>>FRONTEND-DEPLOYER<<<<<<<<<<")
utils.printSeperator();
utils.printSeperator();

let task = process.argv[2];
let directoryPath;
const domain = "baseurl"

if (task === 'deploy') {
    console.log('ARGV[2] Deploy mode, using files from evotingAngular/dist folder');
    directoryPath = path.join(__dirname, "..", "evotingAngular", "dist");
} else {
    console.log('ARGV[2] Build mode, using assets from evotingAngular/src/assets folder');
    directoryPath = path.join(__dirname, "..", "evotingAngular", "src", "assets");
}
utils.printSeperator();

let profile = process.env.CUSTOMER;
if (profile === undefined) {
    console.log("env.CUSTOMER: No Profile specified. Using default profile: -local-");
    profile = "local";
} else {
    console.log("env.CUSTOMER: Using Profile: " + profile);
}
utils.printSeperator();

const defaultMnemonic = "{INSERT_MNEMONIC}";
let mnemonic = process.env.MNEMONIC;
if (mnemonic === undefined) {
    console.log('env.MNEMONIC: Mnemonic not defined. Using default mnemonic: ' + defaultMnemonic);
    mnemonic = defaultMnemonic;
}
utils.printSeperator();

let network = process.env.NETWORK;
if (network === undefined) {
    network = "local";
}
console.log('env.NETWORK Using Network: ' + network);

utils.printSeperator();

let config;
if (task === 'deploy' || profile === 'local') {
    config = require("../shared-resources/src/main/resources/" + network + "_config.json");

    const organizationAbi = require("../solidity/target/generated/abi/com.iteratec.evoting.solidity.contracts/Organization.json");
    config.provider = new ethers.providers.JsonRpcProvider(config.httpRpcServer, {
        name: "unknown",
        ensAddress: config.ensRegistryAddress,
        chainId: config.networkId
    });
    config.wallet = ethers.Wallet.fromMnemonic(mnemonic).connect(config.provider);
    config.signer = new nonceManager.NonceManager(config.wallet);
    config.organizationContract = new ethers.Contract(`${profile}.${domain}`, organizationAbi, config.signer);
    console.log("RPC Server:   " + config.httpRpcServer);
    console.log("Sending from: " + config.wallet.address);
    console.log("Organization: " + config.organizationContract.address);
    utils.printSeperator();
}

async function deploy() {
    const fileList = await fileReader.getFiles(directoryPath);
    console.log("Files to be edited: " + fileList.length)
    utils.printSeperator();

    if (task === 'deploy' || profile === 'local') {
        await sender.sendToStorage(config, fileList.map( file => ({"hash": file.hash, "data": file.data})))
        utils.printSeperator();
    }
    if (task === 'deploy') {
        await sender.updateContractFileList(config, fileList)
    } else {
        await fileWriter.writeFileHashes(fileList.map( file => ({'filename': file.name, 'hash': file.hash})));
    }
}

deploy()
