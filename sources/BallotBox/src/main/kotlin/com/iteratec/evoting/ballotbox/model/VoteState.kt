/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.model

import java.math.BigInteger

data class VoteState(
        val root: BigInteger,
        val stage: BigInteger,
        val anonymous: Boolean
)
