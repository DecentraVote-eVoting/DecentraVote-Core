/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.storageservice.service

import com.iteratec.evoting.storageservice.enums.StorageRole
import com.iteratec.evoting.storageservice.exceptions.SignatureNotValid
import com.iteratec.evoting.storageservice.models.Signature
import org.apache.commons.codec.binary.Hex
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.web3j.abi.datatypes.Address
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

    fun signedPrefixedMessageToKey(signature: Signature): Address {
        return try {
            val r = Hex.decodeHex(signature.signature.substring(2, 66))
            val s = Hex.decodeHex(signature.signature.substring(66, 130))
            val v = Hex.decodeHex(signature.signature.substring(130, 132))

            val sig = Sign.SignatureData(v, r, s)
            val publicKey: BigInteger = Sign.signedPrefixedMessageToKey(signature.message.toByteArray(), sig)
            Address(Keys.toChecksumAddress("0x" + Keys.getAddress(publicKey)))
        } catch (e: Exception) {
            throw SignatureNotValid("Provided values are not valid")
        }
    }

    fun isAllowedToReadData(signature: Signature): Boolean {
        val address = try {
            checkPreconditionsAndReturnAddressFromSignature(signature)
        } catch (e: SignatureNotValid) {
            logger.debug(e.reason)
            return false
        }
        val role = organizationContractService.getUserRole(address)
        if (StorageRole.hasAnyRole(role) ||
                organizationContractService.isStorageServer(address) ||
                organizationContractService.isOracleServer(address)
        ) {
            return true
        }
        return false
    }

    fun isAllowedToWriteData(signature: Signature): Boolean {
        val address = try {
            checkPreconditionsAndReturnAddressFromSignature(signature)
        } catch (e: SignatureNotValid) {
            logger.debug(e.reason)
            return false
        }
        val role = organizationContractService.getUserRole(address)
        if (StorageRole.hasAnyRole(role) ||
                organizationContractService.isStorageServer(address) ||
                organizationContractService.isOracleServer(address) ||
                organizationContractService.isBallotBoxServer(address)
        ) {
            return true
        }
        return false
    }

    private fun checkPreconditionsAndReturnAddressFromSignature(signature: Signature): Address {
        try {
            // TODO getCurrentBlockNumber cache for some seconds
            val currentBlockNumber = getCurrentBlockNumber().toLong()
            val requestBlockNumber = signature.message.toLong()
            return if (requestBlockNumber in (currentBlockNumber - 20)..(currentBlockNumber + 1)) {
                signedPrefixedMessageToKey(signature)
            } else {
                throw SignatureNotValid("Block $requestBlockNumber is outdated. Current Block is $currentBlockNumber")
            }
        } catch (e: NumberFormatException) {
            throw SignatureNotValid("Signature Message is not a Number")
        }
    }
}
