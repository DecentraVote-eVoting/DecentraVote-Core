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

    // Value generated ether by keycloak or from JWT
    // Any type of id: example: Token-<Number>
    @Id
    var id: String? = null

    @Column
    var address: String? = null

    @Column
    var membershipClaim: String? = null

    @Column
    var role: Int? = null
}
