/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.service

import com.iteratec.evoting.oracle.exceptions.SignatureNotValid
import com.iteratec.evoting.oracle.models.Signature
import org.apache.commons.codec.binary.Hex
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.web3j.crypto.Credentials
import org.web3j.crypto.Keys
import org.web3j.crypto.Sign
import org.web3j.utils.Numeric
import java.math.BigInteger

@Service
class SignatureService(
        @Autowired
        val organizationContractService: OrganizationContractService,
        @Autowired
        val credentials: Credentials
) {
    val logger: Logger = LoggerFactory.getLogger(SignatureService::class.java)

    fun createSignature(message: String = getCurrentBlockNumber(), privateKey: String = getPrivateKey()): Signature {
        val credentials: Credentials = Credentials.create(privateKey)
        val signature: Sign.SignatureData = Sign.signPrefixedMessage(message.toByteArray(), credentials.ecKeyPair)
        return Signature(
                signature = Numeric.toHexString(signature.r)
                        + Numeric.toHexString(signature.s).removeRange(0, 2)
                        + Numeric.toHexString(signature.v).removeRange(0, 2),
                message = message
        )
    }

    private fun getPrivateKey(): String {
        return credentials.ecKeyPair.privateKey.toString(16)
    }

    private fun getCurrentBlockNumber(): String {
        return organizationContractService.getCurrentBlock().block.number.toString(10)
    }

    fun signedPrefixedMessageToKey(signature: Signature): String {
        val r = Hex.decodeHex(signature.signature.substring(2, 66))
        val s = Hex.decodeHex(signature.signature.substring(66, 130))
        val v = Hex.decodeHex(signature.signature.substring(130, 132))

        val sig = Sign.SignatureData(v, r, s)
        val publicKey: BigInteger = Sign.signedPrefixedMessageToKey(signature.message.toByteArray(), sig)
        return Keys.toChecksumAddress("0x" + Keys.getAddress(publicKey))
    }

    fun getRoleFromSignature(signature: Signature): Int {
        try {
            val currentBlockNumber = getCurrentBlockNumber().toLong()
            val requestBlockNumber = signature.message.toLong()
            if (requestBlockNumber in (currentBlockNumber - 10)..(currentBlockNumber + 1)) {
                val address = signedPrefixedMessageToKey(signature)
                return organizationContractService.getUserRole(address)
            }
            throw SignatureNotValid("Signed Block is out of range")
        } catch (e: Exception) {
            logger.warn("Signature: ${signature.signature} message: ${signature.message} not valid")
            throw SignatureNotValid("Signature is Invalid")
        }
    }
}
