/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.dtos

data class RegistrationDto(
        val address: String,
        val password: String,
        val encryptedMnemonic: String
)