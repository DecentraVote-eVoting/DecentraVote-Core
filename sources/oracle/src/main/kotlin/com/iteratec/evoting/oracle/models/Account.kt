/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.models


data class Account(
        var id: String?,
        val address: String,
        var name1: String?,
        var name2: String?,
        var uid: String?,
        var membershipClaim: String?,
        var role: Int
)
