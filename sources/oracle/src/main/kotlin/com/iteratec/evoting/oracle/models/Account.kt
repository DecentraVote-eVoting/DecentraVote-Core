/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.models


data class Account (
    var uuid: String?,
    val address: String,
    var field1: String?,
    var field2: String?,
    var field0: String?,
    var membershipClaim: String?,
    var role: Int
)
