/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
const path = require("path");
const fs = require("fs");

async function writeFileHashes(successFiles) {
    console.log('[ ] Create new assets file ...');
    successFiles.sort((a, b) => a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0);
    const json = JSON.stringify(successFiles, null, 2);
    const assets_file = path.join(__dirname, "..", "shared-resources", "src", "main", "resources", "asset_addresses.json");
    fs.writeFile(assets_file, json, 'utf8', () => {
        console.log('[X] Assets file created');
    });
}

module.exports = { writeFileHashes }