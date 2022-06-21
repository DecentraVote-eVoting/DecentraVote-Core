/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.entities

import java.sql.Timestamp
import javax.persistence.*


@Entity
@SequenceGenerator(name="import_user_seq_generator",
        sequenceName="import_user_seq",
        allocationSize=1)
class ImportUser {

        @Id
        @GeneratedValue(strategy = GenerationType.SEQUENCE,
                generator="import_user_seq_generator")
        var id: Long? = null

        @Column
        var name1: String? = null

        @Column
        var name2: String? = null

        @Column(unique = true)
        var uid: String? = null

        @Column
        var accessCode: String? = null

        @Column
        var used: Boolean = false

        @Column
        var validUntil: Timestamp? = null

        @Column
        var role: Int? = null
}
