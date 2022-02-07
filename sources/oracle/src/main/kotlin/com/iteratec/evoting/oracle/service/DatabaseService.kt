/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.service

import com.iteratec.evoting.oracle.entities.AccountEntity
import com.iteratec.evoting.oracle.models.Account
import com.iteratec.evoting.oracle.repository.AccountRepository
import org.springframework.stereotype.Service
import javax.transaction.Transactional

@Service
class DatabaseService(
        val accountRepository: AccountRepository
) {
    @Transactional
    fun addAccountToDB(account: Account) {
        val entity = AccountEntity()
        entity.uuid = account.uuid
        entity.address = account.address
        entity.membershipClaim = account.membershipClaim
        entity.role = account.role
        accountRepository.save(entity)
    }

    @Transactional
    fun getAllAccounts(): List<AccountEntity> {
        return accountRepository.findAll().toList()
    }

    @Transactional
    fun deleteAccount(uuid: String) {
        accountRepository.deleteById(uuid)
    }

    @Transactional
    fun deleteAllAccounts() {
        accountRepository.deleteAll()
    }

    @Transactional
    fun getEthAddrByUuid(uuid: String): String {
        return accountRepository.findById(uuid).map { account -> account.address }.get()
    }

    @Transactional
    fun getUuidByEthAddr(ethAddr: String): String? {
        return accountRepository.findByAddress(ethAddr).map { account -> account.uuid }.get()
    }

    @Transactional
    fun accountExists(uuid: String): Boolean {
        return accountRepository.existsById(uuid)
    }
}
