/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.configuration

import org.web3j.protocol.Web3j
import org.web3j.protocol.core.methods.response.TransactionReceipt
import org.web3j.tx.response.NoOpProcessor

/**
 * Return an {@link TransactionReceipt} receipt back to callers containing only the transaction
 * hash. The official NoOpProcessor is broken and has to be wrapped to work as intended.
 */
class CustomTransactionProcessor(web3j: Web3j?) : NoOpProcessor(web3j) {

    override fun waitForTransactionReceipt(transactionHash: String?): TransactionReceipt {
        super.waitForTransactionReceipt(transactionHash)
        val tr = TransactionReceipt()
        tr.transactionHash = transactionHash
        return tr
    }
}