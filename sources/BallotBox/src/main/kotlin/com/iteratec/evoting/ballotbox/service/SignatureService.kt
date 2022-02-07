/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.service

import com.iteratec.evoting.ballotbox.configuration.Web3jConfig
import com.iteratec.evoting.ballotbox.model.SignedJsonString
import org.springframework.stereotype.Service
import org.web3j.crypto.Credentials
import org.web3j.crypto.Sign
import org.web3j.protocol.core.DefaultBlockParameterName
import org.web3j.utils.Numeric

@Service
class SignatureService(
        val web3: Web3jConfig
) {

    fun createSignature(message: String = getCurrentBlockNumber(), privateKey: String = getPrivateKey()): SignedJsonString {
        val credentials: Credentials = Credentials.create(privateKey)
        val signature: Sign.SignatureData = Sign.signPrefixedMessage(message.toByteArray(), credentials.ecKeyPair)
        return SignedJsonString(
                signature = Numeric.toHexString(signature.r)
                        + Numeric.toHexString(signature.s).removeRange(0, 2)
                        + Numeric.toHexString(signature.v).removeRange(0, 2),
                message = message
        )
    }

    private fun getCurrentBlockNumber(): String {
        return web3.web3j().ethGetBlockByNumber(DefaultBlockParameterName.LATEST, false).send().block.number.toString(10)
    }

    private fun getPrivateKey(): String {
        return web3.credentials().ecKeyPair.privateKey.toString(16)
    }
}
