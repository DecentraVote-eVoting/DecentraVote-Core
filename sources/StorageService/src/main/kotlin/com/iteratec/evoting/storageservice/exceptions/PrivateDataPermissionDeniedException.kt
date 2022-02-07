/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.storageservice.exceptions

class PrivateDataPermissionDeniedException(
        val hash: String
) : Exception()