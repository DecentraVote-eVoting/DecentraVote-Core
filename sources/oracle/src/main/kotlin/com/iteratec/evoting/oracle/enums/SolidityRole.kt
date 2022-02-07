/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.enums

import com.iteratec.evoting.oracle.configuration.utils.Role

enum class SolidityRole(val value: Int) {
    GUEST (1),
    MEMBER (2),
    DIRECTOR (4);

    infix fun check(role: Int): Boolean = (this.value and role) == this.value

    fun toRole(): Role {
        return Role.valueOf(this.name)
    }

    companion object {
        fun hasAnyRole(role: Int): Boolean = role > 0
    }
}
