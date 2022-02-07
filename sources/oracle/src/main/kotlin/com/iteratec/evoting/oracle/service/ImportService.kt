/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.service

import com.iteratec.evoting.oracle.dtos.ImportUserDto
import com.iteratec.evoting.oracle.dtos.ImportUserWithAccessCodeDto
import com.iteratec.evoting.oracle.entities.ImportUser
import com.iteratec.evoting.oracle.exceptions.DuplicateUser
import com.iteratec.evoting.oracle.extensions.unwrap
import com.iteratec.evoting.oracle.repository.ImportUserRepository
import org.apache.commons.codec.binary.Base32
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import java.security.SecureRandom
import java.sql.Timestamp
import java.time.Instant
import java.time.temporal.ChronoUnit
import javax.transaction.Transactional

@Profile("token")
@Service
class ImportService(val importUserRepository: ImportUserRepository,
                    val databaseService: DatabaseService) {
    val logger: Logger = LoggerFactory.getLogger(ImportService::class.java)

    val secureRandom: SecureRandom = SecureRandom()

    @Transactional
    fun generateAccessCodes(data: List<ImportUser>): List<ImportUser> {

        // Check if List of ImportUser has duplicate field0
        val set: Set<String?> = data.map { importUser: ImportUser -> importUser.field0?.toLowerCase() }.toSet()
        if (set.size != data.size) {
            throw Exception("Field0 must be unique")
        }

        return data
                .map { requestImportUser: ImportUser ->
                    val optional = importUserRepository.getByField0(requestImportUser.field0?.toLowerCase() as String)
                    if (optional.isEmpty) {
                        requestImportUser
                    } else {
                        optional.get().field1 = requestImportUser.field1
                        optional.get().field2 = requestImportUser.field2
                        optional.get().field0 = requestImportUser.field0?.toLowerCase()
                        optional.get().role = requestImportUser.role
                        optional.get()
                    }
                }.map { newImportUser: ImportUser ->

                    if (newImportUser.field0.isNullOrEmpty()) {
                        throw Exception("Field0 is null")
                    }

                    if (newImportUser.accessCode == null || newImportUser.used || Timestamp.from(Instant.now()).after(newImportUser.validUntil)) {
                        newImportUser.accessCode = genAccessCode()
                        newImportUser.used = false
                    }
                    newImportUser.validUntil = Timestamp.from(Instant.now().plus(30, ChronoUnit.DAYS))

                    newImportUser.field0 = newImportUser.field0?.toLowerCase()
                    importUserRepository.save(newImportUser)
                }
    }

    @Transactional
    fun getAllImportedMembersWithAccessKeys(): List<ImportUserWithAccessCodeDto> {
        val importUsers = importUserRepository.findAll().toList()
        return importUsers.filter { i -> !i.used }
                .map { importUser -> ImportUserWithAccessCodeDto.ModelMapper.mapFromImportUser(importUser) }
    }

    @Transactional
    fun getAllImportedMembers(): List<ImportUserDto> {
        val importUsers = importUserRepository.findAll().toList()
        return importUsers.filter { i -> !i.used }
                .map { importUser -> ImportUserDto.ModelMapper.mapFromImportUser(importUser) }
    }

    @Synchronized
    fun genAccessCode(): String {
        val randombytes = ByteArray(10)
        secureRandom.nextBytes(randombytes)
        return Base32().encodeAsString(randombytes).replace("=", "")
    }

    fun getUserFromId(id: String): ImportUser? {
        return importUserRepository.findById(id.toLong()).unwrap()
    }

    fun getUserFromAccessCode(accessCode: String): ImportUser {
        val user = this.importUserRepository.getByAccessCode(accessCode).unwrap()
        user?.run {
            if (this.used) {
                throw IllegalArgumentException("Code was alredy used")
            }
            if (Instant.now().isAfter(this.validUntil?.toInstant())) {
                throw IllegalArgumentException("Code is not valid anymore")
            }
            return this
        }
        throw IllegalArgumentException("Code does not exist")
    }

    @Transactional
    fun setUsed(id: String) {
        val user = importUserRepository.findById(id.toLong()).unwrap()
        user?.used = true
        importUserRepository.save(user!!)
    }

    @Transactional
    fun setNotUsed(id: String) {
        val user = importUserRepository.findById(id.toLong()).unwrap()
        user?.used = false
        importUserRepository.save(user!!)
    }

    @Transactional
    fun removeUser(field0: String) {
        val user = importUserRepository.getByField0(field0).get()
        if (!user.used) {
            importUserRepository.deleteById(user.id!!)
        }
    }

    @Transactional
    fun removeAllUsers() {
        importUserRepository.deleteAll()
    }

    @Transactional
    fun replaceUser(address: String): String {
        val uuid = this.databaseService.getUuidByEthAddr(address) ?: throw Exception("uuid not found")
        val index = uuid.indexOf('-')
        val newUuid: String? = if (index == -1) null else uuid.substring(index + 1)
        setNotUsed(newUuid!!)
        return setNewAccessCode(newUuid)

    }

    @Transactional
    fun setNewAccessCode(id: String): String {
        val user = importUserRepository.findById(id.toLong()).unwrap() ?: throw Exception("user not found")
        user.accessCode = genAccessCode()
        importUserRepository.save(user)
        return user.accessCode!!
    }

    @Transactional
    fun extendAccessCodeValidity(field0: String) {
        val user = importUserRepository.getByField0(field0)
        if (user.isPresent) {
            user.get().validUntil = Timestamp.from(Instant.now().plus(30, ChronoUnit.DAYS))
            importUserRepository.save(user.get())
        }
    }

    @Transactional
    fun replaceAccessCodeOfUser(field0: String) {
        val user = importUserRepository.getByField0(field0)
        if (user.isPresent) {
            val newAccessCode = genAccessCode()
            user.get().accessCode = newAccessCode
            importUserRepository.save(user.get())
        }
    }

    @Transactional
    fun setInvalidUntil(field0: String) {
        val user = importUserRepository.getByField0(field0)
        if(user.isPresent) {
            user.get().validUntil = Timestamp.from(Instant.now().minus(1, ChronoUnit.DAYS))
            importUserRepository.save(user.get())
        }
    }

    @Transactional
    fun editImportUser(editedImportUser: ImportUser) {
        val oldImportUser = importUserRepository.getByField0(editedImportUser.field0?.toLowerCase() as String)

        if (oldImportUser.isEmpty) throw Exception("User does not exist!") // GUARD
        if (editedImportUser.field0 == null) throw Exception("Field0 of EditedUser is null!") // GUARD

        oldImportUser.get().field1 = editedImportUser.field1
        oldImportUser.get().field2 = editedImportUser.field2
        oldImportUser.get().field0 = editedImportUser.field0
        oldImportUser.get().role = editedImportUser.role

        val newImportUser = oldImportUser.get()

        importUserRepository.save(newImportUser)
    }

    fun checkIfDuplicate(importUsers: List<ImportUser>) {
        if (importUsers.size != importUsers.distinctBy { it.field0 }.count()) throw DuplicateUser()
        val field0s = importUsers.map { it.field0 }.filterNotNull()
        val dbUsers = importUserRepository.getNumberOfDuplicateField0s(field0s)
        if(dbUsers > 0) throw DuplicateUser()
    }
}
