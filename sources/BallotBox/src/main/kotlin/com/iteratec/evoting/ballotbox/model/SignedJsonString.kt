/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.model

import com.iteratec.evoting.ballotbox.entities.SignedDecisionEntity
import com.iteratec.evoting.ballotbox.entities.SignedNullifierEntity
import com.iteratec.evoting.ballotbox.exceptions.SignatureNotValid
import org.apache.commons.codec.binary.Hex
import org.web3j.abi.datatypes.Address
import org.web3j.crypto.Keys
import org.web3j.crypto.Sign
import java.math.BigInteger

data class SignedJsonString(
    val signature: String,
    val message: String
) {
    val signingAddress: Address = recoverAddress()

    fun toSignedDecisionEntity(): SignedDecisionEntity {
        return SignedDecisionEntity(signature, message, signingAddress.toString())
    }

    fun toSignedNullifierEntity(): SignedNullifierEntity {
        return SignedNullifierEntity(signature, message, signingAddress.toString())
    }

    private fun recoverAddress(): Address {
        return try {
            val r = Hex.decodeHex(signature.substring(2,66))
            val s = Hex.decodeHex(signature.substring(66,130))
            val v = Hex.decodeHex(signature.substring(130,132))

            val sig = Sign.SignatureData(v, r, s)
            val publicKey: BigInteger = Sign.signedPrefixedMessageToKey(message.toByteArray(), sig)
            Address(Keys.toChecksumAddress("0x" + Keys.getAddress(publicKey)))
        } catch (e: Exception) {
            throw SignatureNotValid("Provided values are not valid")
        }
    }
}
