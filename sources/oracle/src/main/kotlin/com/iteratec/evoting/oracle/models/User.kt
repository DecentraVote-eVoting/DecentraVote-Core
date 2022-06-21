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
    val id: String = claims.subject
    val uid: String = claims["uid"] as String
    val name1: String = claims["name1"] as String
    val name2: String = claims["name2"] as String
    val groups: List<String> = claims["roles"] as List<String>
    private var authorities: List<SimpleGrantedAuthority?>? = groups.stream()
            .map { p: String? -> SimpleGrantedAuthority(p) }
            .collect(Collectors.toList())

    override fun getAuthorities(): Collection<GrantedAuthority?>? {
        return authorities
    }

    override fun getUsername(): String {
        return uid
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
}
