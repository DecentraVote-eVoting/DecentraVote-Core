/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.service

import com.iteratec.evoting.oracle.entities.AccountEntity
import com.iteratec.evoting.oracle.entities.ImportUser
import com.iteratec.evoting.oracle.entities.MnemonicEntity
import com.iteratec.evoting.oracle.models.Account
import com.iteratec.evoting.oracle.repository.AccountRepository
import com.iteratec.evoting.oracle.repository.ImportUserRepository
import com.iteratec.evoting.oracle.repository.MnemonicRepository
import org.springframework.stereotype.Service
import javax.transaction.Transactional

@Service
class DatabaseService(
        val accountRepository: AccountRepository,
        val importUserRepository: ImportUserRepository,
        val mnemonicRepository: MnemonicRepository
) {
    @Transactional
    fun saveAccount(account: Account) {
        val entity = AccountEntity()
        entity.id = account.id
        entity.address = account.address
        entity.membershipClaim = account.membershipClaim
        entity.role = account.role
        accountRepository.save(entity)
    }

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

    fun getEthAddrByUuid(uuid: String): String {
        return accountRepository.findById(uuid).map { account -> account.address }.get()
    }

    fun getUuidByEthAddr(ethAddr: String): String {
        return accountRepository.findByAddress(ethAddr).map { account -> account.id }.get()
    }

    fun accountExists(uuid: String): Boolean {
        return accountRepository.existsById(uuid)
    }

    fun getImportUserByUid(uid: String): ImportUser {
        return importUserRepository.getByUid(uid).get()
    }

    @Transactional
    fun saveImportUser(importUser: ImportUser): ImportUser {
        return importUserRepository.save(importUser)
    }

    fun getAllImportUsers(): List<ImportUser> {
        return importUserRepository.findAll().toList()
    }

    fun getImportUserById(id: String): ImportUser {
        return importUserRepository.findById(id.toLong()).get()
    }

    fun getImportUserByAccessCode(accessCode: String): ImportUser {
        return importUserRepository.getByAccessCode(accessCode).get()
    }

    @Transactional
    fun deleteImportUserById(id: Long) {
        importUserRepository.deleteById(id)
    }

    @Transactional
    fun deleteAllImportUser() {
        importUserRepository.deleteAll()
    }

    fun getNumberOfDuplicateUids(uid: List<String>): Int {
        return importUserRepository.getNumberOfDuplicateUids(uid)
    }

    fun getMnemonicEntityByUsername(username: String): MnemonicEntity {
        return mnemonicRepository.findByUsername(username).get()
    }

    fun getMnemonicEntityByAddress(address: String): MnemonicEntity {
        return mnemonicRepository.findByAddress(address).get()
    }

    @Transactional
    fun saveMnemonicEntity(entity: MnemonicEntity) {
        mnemonicRepository.save(entity)
    }

    @Transactional
    fun deleteAllMnemonicEntities() {
        mnemonicRepository.deleteAll()
    }
}
