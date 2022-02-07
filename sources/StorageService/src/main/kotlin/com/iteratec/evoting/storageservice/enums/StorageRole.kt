/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.storageservice.enums

enum class StorageRole(val value: Int) {
    GUEST (1),
    MEMBER (2),
    DIRECTOR (4);

    infix fun check(role: Int): Boolean = (this.value and role) == this.value

    companion object {
        fun hasAnyRole(role: Int): Boolean = role > 0
    }
}
