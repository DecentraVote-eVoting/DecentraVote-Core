/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.configuration.utils

import com.iteratec.evoting.oracle.models.User
import org.springframework.security.authentication.RememberMeAuthenticationToken
import java.security.Principal


object UserUtil {
    fun getUser(principal: Principal?): User? {
        return if (principal == null || principal !is RememberMeAuthenticationToken) {
            null
        } else principal.principal as User
    }
}
