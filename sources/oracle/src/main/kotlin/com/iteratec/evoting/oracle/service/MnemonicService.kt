/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.service

import com.iteratec.evoting.oracle.dtos.ChangePasswordDto
import com.iteratec.evoting.oracle.dtos.RegistrationDto
import com.iteratec.evoting.oracle.entities.MnemonicEntity
import com.iteratec.evoting.oracle.exceptions.InvalidPassword
import com.iteratec.evoting.oracle.exceptions.NotRegistered
import org.springframework.stereotype.Service

@Service
class MnemonicService(
        val databaseService: DatabaseService,
        val organizationContractService: OrganizationContractService
) {

    fun getEncryptedMnemonic(username: String, password: String): String {
        val user = databaseService.getMnemonicEntityByUsername(username)
        if (user.password != password) throw InvalidPassword()
        if (user.address?.let { organizationContractService.getUserRole(it) }!! == 0) throw NotRegistered()
        return user.encryptedMnemonic?: throw Exception("Mnemonic is empty")
    }

    fun changePassword(address: String, changePasswordDto: ChangePasswordDto) {
        val mnemonicEntity = databaseService.getMnemonicEntityByAddress(address)
        mnemonicEntity.password = changePasswordDto.password
        mnemonicEntity.encryptedMnemonic = changePasswordDto.encryptedMnemonic
        databaseService.saveMnemonicEntity(mnemonicEntity)
    }

    fun saveEncryptedMnemonic(username: String, registrationDto: RegistrationDto) {
        val mnemonicEntity = try {
            databaseService.getMnemonicEntityByUsername(username)
        } catch (e: NoSuchElementException) {
            MnemonicEntity()
        }
        mnemonicEntity.username = username
        mnemonicEntity.password = registrationDto.password
        mnemonicEntity.encryptedMnemonic = registrationDto.encryptedMnemonic
        mnemonicEntity.address = registrationDto.address
        databaseService.saveMnemonicEntity(mnemonicEntity)
    }
}