/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.configuration

import com.iteratec.evoting.oracle.configuration.utils.CookieUtils
import com.iteratec.evoting.oracle.configuration.utils.JwtUtils
import com.iteratec.evoting.oracle.models.User
import io.jsonwebtoken.ExpiredJwtException
import org.springframework.security.authentication.AbstractAuthenticationToken
import org.springframework.security.authentication.RememberMeAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.filter.OncePerRequestFilter
import java.io.IOException
import javax.servlet.FilterChain
import javax.servlet.ServletException
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

class JwtFilter(private val jwtUtils: JwtUtils, private val cookieUtils: CookieUtils) : OncePerRequestFilter() {


    private fun handleAccessToken(request: HttpServletRequest): AbstractAuthenticationToken? {
        var accessToken: String? = cookieUtils.getAccessToken(request)
        if (accessToken == null) {
            accessToken = request.getHeader("X-Authorization")
        }
        return if (accessToken != null && accessToken.isNotEmpty()) {
            try {
                val user: User? = jwtUtils.getUserFromToken(accessToken)
                if (user != null) RememberMeAuthenticationToken(user.id, user, user.authorities) else null
            } catch (var5: ExpiredJwtException) {
                null
            }
        } else {
            null
        }
    }

    @Throws(ServletException::class, IOException::class)
    override fun doFilterInternal(request: HttpServletRequest, response: HttpServletResponse, chain: FilterChain) {
        try {
            val authToken = handleAccessToken(request)
            if (authToken != null) {
                SecurityContextHolder.getContext().authentication = authToken
            }
        } catch (var5: Exception) {
        }
        chain.doFilter(request, response)
    }

}
