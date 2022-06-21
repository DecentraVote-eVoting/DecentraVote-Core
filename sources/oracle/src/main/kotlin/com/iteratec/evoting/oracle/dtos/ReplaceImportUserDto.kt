package com.iteratec.evoting.oracle.dtos

data class ReplaceImportUserDto(
        val uid: String,
        val name1: String,
        val name2: String,
        val address: String
)