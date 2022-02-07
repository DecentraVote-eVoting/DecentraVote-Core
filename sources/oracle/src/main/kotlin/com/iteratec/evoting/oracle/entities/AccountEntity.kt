/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.entities

import javax.persistence.Column
import javax.persistence.Entity
import javax.persistence.Id

@Entity
class AccountEntity {
    @Id
    var uuid: String? = null

    @Column
    var address: String? = null

    @Column
    var membershipClaim: String? = null

    @Column
    var role: Int? = null
}
