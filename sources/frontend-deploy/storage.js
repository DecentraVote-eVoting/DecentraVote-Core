/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
const request = require("request-promise");

const sleep = (waitTimeInSec) => new Promise(resolve => setTimeout(resolve, waitTimeInSec * 1000));

async function getStorageUrls(organizationContract) {
    const filter = organizationContract.filters.StorageAdded(null);
    const events = await organizationContract.queryFilter(filter, 0, 'latest');
    return events.map(event => event.args.storageUrl)
}

async function readyCheck(urls, waitInSec, timeOut) {
    console.log("[ ] Performing Ready Check...");
    console.log("\t" + urls.map( url => url+"/api/health"));
    if (timeOut === 0) {
        console.error("[-] Ready check failed after to many retries");
        process.exit(1);
    }
    let requests = [];
    let successCounter = {};
    urls.forEach(url => successCounter[url] = 0);

    for (let url of urls) {

        requests.push(request.get({
                resolveWithFullResponse: true,
                url: url + "/api/health"
            }).then(function (response) {
                console.log("[X] Ready Check Success for: " + url);
                successCounter[url]++;
            }).catch(function (err) {
                console.log("[-] Ready Check failed: " + url + " - "+ err.message);
            })
        );
    }
    await Promise.all(requests);
    for (let url of urls) {
        if (successCounter[url] > 0) {
            return;
        }
    }
    await sleep(waitInSec);
    await readyCheck(urls, waitInSec + 5, timeOut - 1);
}

module.exports = { getStorageUrls, readyCheck }