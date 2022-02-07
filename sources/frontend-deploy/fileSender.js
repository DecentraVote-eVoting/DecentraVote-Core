/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
const storage = require("./storage.js");
const utils = require("./utils.js");
const request = require("request-promise");

async function sendToStorage(config, fileList) {
    const urls = await storage.getStorageUrls(config.organizationContract);
    if(urls.length === 0) {
        console.error("No Storage URLs found")
        process.exit(1);
    }
    else
        await storage.readyCheck(urls, 10, 10);

    utils.printSeperator();
    console.log("[ ] Sending Files to these URLs:");
    console.log("\t" + urls);

    let successCounter = 0;
    for (let url of urls) {
        let blockNumber = await config.provider.getBlockNumber();
        let signature = await config.signer.signMessage(blockNumber.toString());
        let body = JSON.stringify(fileList)

        await request.post({
            resolveWithFullResponse: true,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': body.length,
                'Signature': signature.toString(),
                'Message': blockNumber.toString(),
                'Public': true
            },
            url: url + "/api/storage/save",
            body: body
        }).then(function (response) {
            successCounter++;
            console.log('[X] Post Success\n\tstatusCode: ', response.statusCode + " \n\turl: " + url);
        }).catch(function (err) {
            console.error('[-] Post Failed\n\tstatusCode: ', err.statusCode + " \n\turl: " + url);
            console.error('[-] Reason:\n\t' + err.error);
        })
    }
    if(successCounter === 0)
        process.exit(1);
}

async function updateContractFileList(config, fileList) {
    console.log("[ ] Updating contract with new file hashes");
    const frontendFiles = fileList.filter(file => !file.isAsset)
        .sort((a, b) => b.name.localeCompare(a.name))
        .filter(file => file.name !== "index.html" && file.name !== "3rdpartylicenses.txt")
        .map(file => file.hash);

    config.organizationContract.changeFileHash(frontendFiles, {gasLimit: config.gasLimit, gasPrice: config.gasPrice}).then((tx) => {
            tx.wait().then((res) => {
                console.log("[ ] Transaction sent. Waiting for mining ...");
                if (res.status === 1) {
                    console.log("[X] Transaction was successfully mined");
                } else {
                    console.error("Transaction was not mined");
                    process.exit(1);
                }
            })
        }
    );
}

module.exports = { sendToStorage, updateContractFileList };
