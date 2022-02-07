/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.service

import com.iteratec.evoting.oracle.entities.AccountEntity
import org.keycloak.admin.client.resource.RealmResource
import org.keycloak.representations.idm.UserRepresentation
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Profile
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.web3j.abi.datatypes.generated.Uint8
import org.web3j.utils.Numeric
import java.math.BigInteger

@Profile("keycloak")
@Service
class SynchronizeKeycloakMemberService(
        val databaseService: DatabaseService,
        val organizationContract: OrganizationContractService,
        val keycloakRealm: RealmResource
) {
    val logger: Logger = LoggerFactory.getLogger(SynchronizeKeycloakMemberService::class.java)

    // @Scheduled(cron = "0 0 12 * * ?") Fires every Day at 12PM
    @Scheduled(fixedRateString = "\${synchronization.rate}", initialDelay = 10000)
    fun synchronizeMember() {
        try {
            if (organizationContract.getGlobalMeetingStage() == BigInteger.ZERO) {
                val keycloak = keycloakRealm
                val keycloakUuids: List<String?> = keycloak.users().list().map { account: UserRepresentation -> account.id }
                val registeredAccounts: List<AccountEntity> = databaseService.getAllAccounts()

                registeredAccounts.filterNot { it.uuid in keycloakUuids }
                        .map { account: AccountEntity ->
                            organizationContract.editUser(account.address as String, Numeric.hexStringToByteArray(account.membershipClaim), Uint8(0)).also { trx: String ->
                                logger.info("Account: ${account.address} is removed from the Blockchain: TransactionHash: $trx")
                            }
                            databaseService.deleteAccount(account.uuid as String).also {
                                logger.info("Account: ${account.address} with uuid: ${account.uuid} is removed from the Database")
                            }
                        }
                logger.debug("Synchronization finished successfully")
            } else logger.debug("Synchronization cannot be done with a Meeting at Stage > Created and < Closed")
        } catch (ex: Exception) {
            logger.warn("Synchronization Failed: Reason: ${ex.message}")
        }
    }
}
