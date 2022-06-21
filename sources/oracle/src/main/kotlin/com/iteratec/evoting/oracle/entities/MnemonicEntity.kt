/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.entities

import javax.persistence.*

@Entity
@SequenceGenerator(name = "mnemonic_seq_generator",
        sequenceName = "mnemonic_seq",
        allocationSize = 1)
class MnemonicEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE,
            generator = "mnemonic_seq_generator")
    var id: Long? = null

    @Column
    var username: String? = null
    @Column
    var password: String? = null
    @Column
    var encryptedMnemonic: String? = null
    @Column
    var address: String? = null
}