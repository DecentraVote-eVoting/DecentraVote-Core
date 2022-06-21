/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.service

import com.iteratec.evoting.oracle.dtos.ImportUserDto
import com.iteratec.evoting.oracle.dtos.ImportUserWithAccessCodeDto
import com.iteratec.evoting.oracle.dtos.ReplaceImportUserDto
import com.iteratec.evoting.oracle.entities.ImportUser
import com.iteratec.evoting.oracle.exceptions.DuplicateUser
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
class ImportService(val databaseService: DatabaseService) {

    val logger: Logger = LoggerFactory.getLogger(ImportService::class.java)
    val secureRandom: SecureRandom = SecureRandom()

    @Transactional
    fun generateAccessCodes(data: List<ImportUser>): List<ImportUser> {

        // Check if List of ImportUser has duplicate uid
        val set: Set<String?> = data.map { importUser: ImportUser -> importUser.uid?.lowercase() }.toSet()
        if (set.size != data.size) {
            throw Exception("Uid must be unique")
        }

        return data
                .map { requestImportUser: ImportUser ->
                    try {
                        val importUser = databaseService.getImportUserByUid(requestImportUser.uid?.lowercase()!!)
                        importUser.name1 = requestImportUser.name1
                        importUser.name2 = requestImportUser.name2
                        importUser.uid = requestImportUser.uid?.lowercase()
                        importUser.role = requestImportUser.role
                        importUser
                    } catch(exception: NoSuchElementException) {
                        requestImportUser
                    }
                }.map { newImportUser: ImportUser ->

                    if (newImportUser.uid.isNullOrEmpty()) {
                        throw Exception("Uid is null")
                    }

                    if (newImportUser.accessCode == null || newImportUser.used || Timestamp.from(Instant.now()).after(newImportUser.validUntil)) {
                        newImportUser.accessCode = genAccessCode()
                        newImportUser.used = false
                    }
                    newImportUser.validUntil = Timestamp.from(Instant.now().plus(30, ChronoUnit.DAYS))

                    newImportUser.uid = newImportUser.uid?.lowercase()
                    databaseService.saveImportUser(newImportUser)
                }
    }

    @Transactional
    fun getAllImportedMembersWithAccessKeys(): List<ImportUserWithAccessCodeDto> {
        val importUsers = databaseService.getAllImportUsers()
        return importUsers.filter { i -> !i.used }
                .map { importUser -> ImportUserWithAccessCodeDto.ModelMapper.mapFromImportUser(importUser) }
    }

    @Transactional
    fun getAllImportedMembers(): List<ImportUserDto> {
        val importUsers = databaseService.getAllImportUsers()
        return importUsers.filter { i -> !i.used }
                .map { importUser -> ImportUserDto.ModelMapper.mapFromImportUser(importUser) }
    }

    @Synchronized
    fun genAccessCode(): String {
        val randomBytes = ByteArray(10)
        secureRandom.nextBytes(randomBytes)
        return Base32().encodeAsString(randomBytes).replace("=", "")
    }

    fun getUserFromId(id: String): ImportUser? {
        return databaseService.getImportUserById(id)
    }

    fun getUserFromAccessCode(accessCode: String): ImportUser {
        val user = databaseService.getImportUserByAccessCode(accessCode)
        user.run {
            if (this.used) {
                throw IllegalArgumentException("Code was already used")
            }
            if (Instant.now().isAfter(this.validUntil?.toInstant())) {
                throw IllegalArgumentException("Code is not valid anymore")
            }
            return this
        }
    }

    @Transactional
    fun setUsed(id: String) {
        val user = databaseService.getImportUserById(id)
        user.used = true
        databaseService.saveImportUser(user)
    }

    @Transactional
    fun setNotUsed(id: String) {
        val user = databaseService.getImportUserById(id)
        user.used = false
        databaseService.saveImportUser(user)
    }

    @Transactional
    fun removeUser(uid: String) {
        val user = databaseService.getImportUserByUid(uid)
        if (!user.used) {
            user.id?.let { databaseService.deleteImportUserById(it) }
        }
    }

    @Transactional
    fun removeAllUsers() {
        databaseService.deleteAllImportUser()
    }

    @Transactional
    fun replaceUser(dto: ReplaceImportUserDto): String {
        val uuid = this.databaseService.getUuidByEthAddr(dto.address)
        val index = uuid.indexOf('-')
        val newUuid: String? = if (index == -1) null else uuid.substring(index + 1)
        setNotUsed(newUuid!!)
        return setNewAccessCodeAndUpdateFields(newUuid, dto)
    }

    @Transactional
    fun setNewAccessCodeAndUpdateFields(id: String, dto: ReplaceImportUserDto): String {
        val user = databaseService.getImportUserById(id)
        user.accessCode = genAccessCode()
        user.uid = dto.uid
        user.name1 = dto.name1
        user.name2 = dto.name2
        databaseService.saveImportUser(user)
        return user.accessCode!!
    }

    @Transactional
    fun extendAccessCodeValidity(uid: String) {
        val user = databaseService.getImportUserByUid(uid)
        user.validUntil = Timestamp.from(Instant.now().plus(30, ChronoUnit.DAYS))
        databaseService.saveImportUser(user)
    }

    @Transactional
    fun replaceAccessCodeOfUser(uid: String) {
        val user = databaseService.getImportUserByUid(uid)
        val newAccessCode = genAccessCode()
        user.accessCode = newAccessCode
        databaseService.saveImportUser(user)
    }

    @Transactional
    fun setInvalidUntil(uid: String) {
        val user = databaseService.getImportUserByUid(uid)
        user.validUntil = Timestamp.from(Instant.now().minus(1, ChronoUnit.DAYS))
        databaseService.saveImportUser(user)
    }

    @Transactional
    fun editImportUser(editedImportUser: ImportUser) {
        if (editedImportUser.uid == null) throw Exception("Uid of EditedUser is null!")

        val importUser = databaseService.getImportUserByUid(editedImportUser.uid?.lowercase() as String)
        importUser.name1 = editedImportUser.name1
        importUser.name2 = editedImportUser.name2
        importUser.uid = editedImportUser.uid
        importUser.role = editedImportUser.role

        databaseService.saveImportUser(importUser)
    }

    fun checkIfDuplicate(importUsers: List<ImportUser>) {
        if (importUsers.size != importUsers.distinctBy { it.uid }.count()) throw DuplicateUser()
        val uids = importUsers.mapNotNull { it.uid }
        if(databaseService.getNumberOfDuplicateUids(uids) > 0) throw DuplicateUser()
    }
}
