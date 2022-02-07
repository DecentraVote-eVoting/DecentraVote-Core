/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.entities

import com.google.gson.Gson
import com.iteratec.evoting.ballotbox.model.ZKProof
import com.iteratec.evoting.ballotbox.model.ZKProofPoints
import java.io.Serializable
import javax.persistence.Column
import javax.persistence.Embeddable

@Embeddable
data class ZKProofEntity(
    @Column(name = "zk_proof_json", columnDefinition = "TEXT")
    val proof: String,
    @Column(name = "zk_anon_address")
    val anonymousAddress: String,
    @Column(name = "zk_root")
    val root: String,
    @Column(name = "zk_index")
    val index: String,
    @Column(name = "zk_nullifier")
    val nullifier: String,

): Serializable {
    fun toModel(): ZKProof {
        return ZKProof(
                Gson().fromJson(proof, ZKProofPoints::class.java),
                listOf(
                        anonymousAddress,
                        root,
                        index,
                        nullifier
                )
        )
    }
}
