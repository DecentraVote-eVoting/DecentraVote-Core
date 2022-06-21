/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.configuration.utils

import com.iteratec.evoting.oracle.enums.SolidityRole

enum class Role(val value: String) {
    MEMBER ("ROLE_member"),
    DIRECTOR ("ROLE_director"),
    GUEST ("ROLE_guest");

    fun toSolidityRole(): SolidityRole {
        return SolidityRole.valueOf(this.name)
    }

    companion object {
        const val authorityString: String = "ROLE_director, ROLE_member, ROLE_guest"

        private val map = values().associateBy(Role::value)
        fun fromString(value: String) = map[value]
    }
}
