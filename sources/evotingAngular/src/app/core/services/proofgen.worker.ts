/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
/// <reference lib="webworker" />
// @ts-ignore
import snarkjs = require('snarkjs');

addEventListener('message', ({data}) => {
  const {proof, publicSignals} = snarkjs.groth.genProof(data.pk, data.wittness, true);
  postMessage({proof, publicSignals});
});
