/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.service

import com.iteratec.evoting.oracle.configuration.utils.JwtUtils
import com.iteratec.evoting.oracle.entities.MnemonicEntity
import com.iteratec.evoting.oracle.enums.SolidityRole
import com.iteratec.evoting.oracle.extensions.toClaim
import com.iteratec.evoting.oracle.extensions.toHash
import com.iteratec.evoting.oracle.models.Account
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.web3j.abi.datatypes.generated.Uint8
import org.web3j.crypto.Hash
import org.web3j.utils.Numeric
import java.math.BigInteger
import java.time.Instant
import java.util.concurrent.TimeUnit

@Service
class AccountService(
    val databaseService: DatabaseService,
    val storageService: StorageService,
    val organizationContract: OrganizationContractService,
    val aesEncryptionService: AesEncryptionService
) {

    @Autowired(required = false)
    lateinit var importService: ImportService

    @Value("\${web3.mnemonic}")
    val mnemonic: String? = null

    @Value("\${admin.password}")
    val password: String? = null

    val logger: Logger = LoggerFactory.getLogger(AccountService::class.java)

    @Throws
    @Synchronized
    fun registration(
        account: Account,
        hashedSecret: String?,
        identityProvider: JwtUtils.IdentityProvider?,
        id: String?
    ): String {
        if (identityProvider == JwtUtils.IdentityProvider.Token) {
            validateToken(id ?: throw Exception("ID is not set but IdentityProvider is Token"))
        }

        var replace = false
        var oldAccount: String? = null
        val role = organizationContract.getUserRole(account.address)
        if (SolidityRole.MEMBER.check(role)) throw Exception("Ethereum Address ${account.address} is already a registered Member!")
        if (SolidityRole.GUEST.check(role)) throw Exception("Ethereum Address ${account.address} is already a registered Guest!")

        if (databaseService.accountExists(account.id!!)) {
            val dbEthAddress = databaseService.getEthAddrByUuid(account.id!!)
            val dbRole = organizationContract.getUserRole(dbEthAddress)
            if (SolidityRole.hasAnyRole(dbRole)) {
                replace = true
                oldAccount = dbEthAddress
                if (hashedSecret == null) {
                    throw Exception("Secret cannot be null for replacement")
                }
            }
        }
        val claim = account.toClaim()
        account.membershipClaim = Hash.sha3String(claim)
        storageService.sendMembershipClaimToStorage(account, claim)
        databaseService.saveAccount(account)

        if (identityProvider == JwtUtils.IdentityProvider.Token) {
            importService.setUsed(id?.replace(JwtUtils.IdentityProvider.Token.name + "-", "")!!)
        }
        return try {
            if (SolidityRole.GUEST.check(account.role))
                transactUser(account, false, null, null)
            else
                transactUser(account, replace, oldAccount, hashedSecret)
        } catch (e: Exception) {
            if (identityProvider == JwtUtils.IdentityProvider.Token) {
                importService.setNotUsed(id?.replace(JwtUtils.IdentityProvider.Token.name + "-", "")!!)
            }
            logger.error("Transaction to the Blockchain failed for ${account.address}")
            logger.error(e.message)
            throw Exception("Transaction to the Blockchain failed for ${account.address}")
        }
    }

    private fun transactUser(account: Account, replace: Boolean, oldAccount: String?, hashedSecret: String?): String {
        return if (replace && !oldAccount.isNullOrEmpty()) {
            organizationContract.replaceMember(
                account.address,
                Numeric.hexStringToByteArray(account.membershipClaim),
                oldAccount,
                BigInteger(
                    hashedSecret
                        ?: throw Exception("hashed Secret not provided for account ${account.address}, oldAccount $oldAccount")
                )
            )
        } else {
            organizationContract.newUser(
                account.address,
                Numeric.hexStringToByteArray(account.membershipClaim),
                Uint8(account.role.toLong())
            )
        }
    }

    private fun validateToken(id: String) {
        val importUser = this.importService.getUserFromId(id.replace(JwtUtils.IdentityProvider.Token.name + "-", ""))
        if (importUser!!.used || Instant.now().isAfter(importUser.validUntil?.toInstant())) {
            throw Exception("AccessCode already used or too old")
        }
    }

    fun registerInitialDirector(directorAddress: String) {
        val role = organizationContract.getUserRole(directorAddress)
        if (SolidityRole.DIRECTOR.check(role) && !SolidityRole.MEMBER.check(role)) {
            val account = Account(
                id = "DECVO_ADMIN_1",
                address = directorAddress,
                name1 = "DecentraVote",
                name2 = "Team",
                uid = "admin",
                membershipClaim = "",
                role = SolidityRole.MEMBER.value or SolidityRole.DIRECTOR.value
            )
            val claim = account.toClaim()
            account.membershipClaim = Hash.sha3String(claim)

            for (i in 1..18) {
                try {
                    storageService.sendMembershipClaimToStorage(account, claim)
                    organizationContract.setInitialDirectorClaim(
                        account.address,
                        Numeric.hexStringToByteArray(account.membershipClaim)
                    )
                    logger.info("Initial Director registered.")
                    break
                } catch (e: Exception) {
                    TimeUnit.SECONDS.sleep(10)
                    logger.error("Retrying registering initial Director because of error: " + e.message)
                }
            }
            databaseService.saveAccount(account)
            saveAdminMnemonicEntity(directorAddress)
        } else {
            logger.info("Initial Director already registered")
        }
    }

    fun saveAdminMnemonicEntity(directorAddress: String) {
        val mnemonicEntity = try {
            databaseService.getMnemonicEntityByAddress(directorAddress)
        } catch (e: NoSuchElementException) {
            MnemonicEntity()
        }
        mnemonicEntity.encryptedMnemonic = aesEncryptionService.encrypt(mnemonic?: throw Exception(), password?: throw Exception())
        mnemonicEntity.password = password?.toHash()
        mnemonicEntity.username = "admin"
        mnemonicEntity.address = directorAddress
        databaseService.saveMnemonicEntity(mnemonicEntity)
    }
}
