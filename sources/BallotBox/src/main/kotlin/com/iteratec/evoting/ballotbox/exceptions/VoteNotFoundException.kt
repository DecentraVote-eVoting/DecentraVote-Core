/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.ballotbox.exceptions

class VoteNotFoundException(
        var reason: String? = null
): Exception()