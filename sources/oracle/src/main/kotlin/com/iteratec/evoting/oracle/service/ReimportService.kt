/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.service

import com.google.common.primitives.UnsignedInts.toLong
import com.iteratec.evoting.oracle.entities.AccountEntity
import com.iteratec.evoting.oracle.enums.SolidityRole
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.web3j.utils.Numeric
import java.math.BigInteger

@Service
class ReimportService(
        val databaseService: DatabaseService,
        val organizationContract: OrganizationContractService
) {
    val logger: Logger = LoggerFactory.getLogger(ReimportService::class.java)

    fun reimportUser(): String {
        val accounts: List<AccountEntity> = databaseService.getAllAccounts()
        val addresses: MutableList<String> = ArrayList()
        val membershipClaims: MutableList<ByteArray> = ArrayList()
        val roles: MutableList<Long> = ArrayList()
        accounts.forEach { account: AccountEntity ->
            if (!account.address.isNullOrEmpty() && !account.membershipClaim.isNullOrEmpty() && SolidityRole.hasAnyRole(account.role!!)) {
                addresses.add(account.address!!)
                membershipClaims.add(Numeric.hexStringToByteArray(account.membershipClaim))
                roles.add(toLong(account.role!!))
            }
        }
        return if (addresses.isNotEmpty()) {
            logger.info("Try reimport set of member to contract: ${organizationContract.organization.contractAddress}")
            organizationContract.newUserSet(addresses, membershipClaims, roles).also {
                logger.info("Reimport success: TransactionHash: $it")
            }
        } else throw Exception("Empty Database")
    }

    fun isEmptyContract(): Boolean {
        return organizationContract.getUserSize() == BigInteger.ONE
    }
}
