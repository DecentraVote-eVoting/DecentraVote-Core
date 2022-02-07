/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.service

import com.iteratec.evoting.ballotbox.model.ZKProof

interface IVerifierService {
    fun verifyProof(zkproof: ZKProof): Boolean
}
