/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.model

import org.web3j.abi.datatypes.Address

data class OpenBallotNullifier(
        val index: Int,
        val voteAddress: String,
        val signer: String
) {
    fun signerAsAddress(): Address {
        return Address(this.signer)
    }
}