/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.service

import com.iteratec.evoting.solidity.contracts.Organization
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service
import org.web3j.abi.datatypes.Address
import org.web3j.abi.datatypes.DynamicArray
import org.web3j.abi.datatypes.generated.Bytes32
import org.web3j.abi.datatypes.generated.Uint256
import org.web3j.abi.datatypes.generated.Uint8
import org.web3j.protocol.Web3j
import org.web3j.protocol.core.DefaultBlockParameterName
import org.web3j.protocol.core.methods.response.EthBlock
import java.math.BigInteger

@Service
class OrganizationContractService(
    @Autowired
    val organization: Organization,
    @Autowired
    val web3j: Web3j
) {

    val logger: Logger = LoggerFactory.getLogger(OrganizationContractService::class.java)

    fun getUserRole(entityAddress: String): Int {
        return organization.getUserRole(Address(entityAddress)).send().value.toInt()
    }

    fun getUserSize(): BigInteger {
        return organization.userSize.send().value
    }

    fun getGlobalMeetingStage(): BigInteger {
        return organization.globalMeetingStage().send().value
    }

    fun getCurrentBlock(): EthBlock {
        return web3j.ethGetBlockByNumber(DefaultBlockParameterName.LATEST, false).send()
    }

    @Synchronized
    fun newUser(entityAddress: String, hashedClaim: ByteArray, role: Uint8): String {
        return try {
            organization.addUser(Address(entityAddress), Bytes32(hashedClaim), role).send().transactionHash
        } catch (e: Exception) {
            logger.error(e.message)
            throw Exception("Error sending Transaction")
        }
    }

    @Synchronized
    fun newUserSet(
        entityAddresses: MutableList<String>,
        hashedClaims: MutableList<ByteArray>,
        roles: MutableList<Long>
    ): String {
        val addresses = DynamicArray(Address::class.java, entityAddresses.map { x -> Address(x) })
        val hashes = DynamicArray(Bytes32::class.java, hashedClaims.map { x -> Bytes32(x) })
        val typedRoles = DynamicArray(Uint8::class.java, roles.map { x -> Uint8(x) })

        return try {
            organization.addUsers(addresses, hashes, typedRoles).send().transactionHash
        } catch (e: Exception) {
            logger.error(e.message)
            throw Exception("Error sending Transaction")
        }
    }

    @Synchronized
    fun editUser(entityAddress: String, claimHash: ByteArray, role: Uint8): String {
        return try {
            organization.editUser(Address(entityAddress), Bytes32(claimHash), role).send().transactionHash
        } catch (e: Exception) {
            logger.error(e.message)
            throw Exception("Error sending Transaction")
        }
    }

    @Synchronized
    fun replaceMember(
        entityAddress: String,
        membershipClaim: ByteArray,
        oldAccount: String,
        hashedSecret: BigInteger?
    ): String {
        return try {
            organization.replaceUser(
                Address(entityAddress),
                Bytes32(membershipClaim),
                Address(oldAccount),
                Uint256(hashedSecret)
            ).send().transactionHash
        } catch (e: Exception) {
            logger.error(e.message)
            throw Exception("Error sending Transaction")
        }
    }

    @Synchronized
    fun setInitialDirectorClaim(entityAddress: String, membershipClaim: ByteArray): String {
        return try {
            organization.setClaimHash(Address(entityAddress), Bytes32(membershipClaim))
                .send().transactionHash
            organization.editUser(Address(entityAddress), Bytes32(membershipClaim), Uint8(0b110))
                .send().transactionHash
        } catch (e: Exception) {
            logger.error(e.message)
            throw Exception("Error sending Transaction to set the initial director claim hash")
        }
    }
}
