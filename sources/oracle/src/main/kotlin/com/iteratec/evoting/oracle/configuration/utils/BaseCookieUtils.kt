/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.configuration.utils

import java.util.stream.Stream
import javax.servlet.http.Cookie
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

abstract class BaseCookieUtils {

    fun setCookie(name: String?, value: String?, maxAge: Int, response: HttpServletResponse, domain: String) {
        val cookie = Cookie(name, value)
        cookie.domain = domain
        cookie.maxAge = maxAge
        cookie.path = path
        response.addCookie(cookie)
    }

    fun setCookie(name: String?, value: String?, response: HttpServletResponse, domain: String) {
        this.setCookie(name, value, 31536000, response, domain)
    }

    fun setSessionCookie(name: String?, value: String?, response: HttpServletResponse, domain: String) {
        this.setCookie(name, value, -1, response, domain)
    }

    fun removeCookie(name: String?, response: HttpServletResponse, domain: String) {
        val cookie = Cookie(name, null as String?)
        cookie.domain = domain
        cookie.maxAge = 0
        cookie.path = path
        response.addCookie(cookie)
    }

    fun getCookie(name: String, request: HttpServletRequest): Cookie? {
        return if (request.cookies != null) Stream.of(*request.cookies).filter { p: Cookie -> p.name == name }.findFirst().orElse(null) else null
    }

    private val path: String
        private get() = "/"

}
