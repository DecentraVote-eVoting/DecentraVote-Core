/**
DecentraVote
Copyright (C) 2018-2022 iteratec
 */
package com.iteratec.evoting.oracle.models

import com.iteratec.evoting.oracle.configuration.utils.JwtUtils
import io.jsonwebtoken.Claims
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import java.util.stream.Collectors

data class User(val claims: Claims, val identityProvider: JwtUtils.IdentityProvider) : UserDetails {
    val id: String
    val field0: String
    val field1: String
    val field2: String
    val groups: List<String>
    private var authorities: List<SimpleGrantedAuthority?>? = null
    override fun getAuthorities(): Collection<GrantedAuthority?> {
        return authorities!!
    }

    override fun getUsername(): String {
        return field0
    }

    override fun getPassword(): String {
        return ""
    }

    override fun isAccountNonExpired(): Boolean {
        return true
    }

    override fun isAccountNonLocked(): Boolean {
        return true
    }

    override fun isCredentialsNonExpired(): Boolean {
        return true
    }

    override fun isEnabled(): Boolean {
        return true
    }

    init {
        id = claims.subject
        field0 = claims["field0"] as String
        field1 = claims["field1"] as String
        field2 = claims["field2"] as String
        groups = claims["roles"] as List<String>
        authorities = groups.stream()
                .map { p: String? -> SimpleGrantedAuthority(p) }
                .collect(Collectors.toList())
    }
}
