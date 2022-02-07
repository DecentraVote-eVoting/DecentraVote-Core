/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
const path = require("path");
const fs = require("fs");
const ethers = require("ethers");
const mime = require('mime-types');

async function getFiles(dir, isAsset = false) {
    const files = fs.readdirSync(dir);
    const fileList = [];
    for (const file of files) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            let dirFiles = await getFiles(path.join(dir, file), file === "assets" || isAsset);
            Array.prototype.push.apply(fileList, dirFiles);
        } else {
            let fileLocation = path.join(dir, file);
            let data = fs.readFileSync(fileLocation);
            let mimeType = mime.lookup(fileLocation);
            if (!mimeType) {
                mimeType = "application/bin"
            }
            let val = "data:" + mimeType + ";base64," + data.toString('base64');
            let hash = ethers.utils.keccak256([...Buffer.from(val)]);
            console.log("Add File: " + file);
            fileList.push({
                data: val,
                hash: hash,
                isAsset: isAsset,
                name: path.relative(dir, fileLocation)
            })
        }
    }
    return fileList;
}

module.exports = { getFiles }