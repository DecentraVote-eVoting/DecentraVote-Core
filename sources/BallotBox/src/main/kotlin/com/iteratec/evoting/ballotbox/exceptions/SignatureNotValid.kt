/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.exceptions

class SignatureNotValid(
        val reason: String? = null
) : Exception()