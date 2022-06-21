package com.iteratec.evoting.oracle.dtos

data class ChangePasswordDto (
        val password: String,
        val encryptedMnemonic: String
)