/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.configuration.utils

import org.springframework.stereotype.Component
import javax.servlet.http.Cookie
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

@Component
class CookieUtils : BaseCookieUtils() {

    fun getAccessToken(request: HttpServletRequest): String? {
        val cookie: Cookie? = this.getCookie(jwtAccessCookieName, request)
        return cookie?.value
    }

    val jwtAccessCookieName: String
        get() = "DecentraVote-access"

    val jwRefreshCookieName: String
        get() = "DecentraVote-refresh"
}
